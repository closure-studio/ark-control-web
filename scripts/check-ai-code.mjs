import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = process.cwd();
const SOURCE_ROOTS = ["src", "worker"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const ALLOWED_NUMBERS = new Set([-1, 0, 1]);
const LOGIC_OPERATORS = new Set([
  ts.SyntaxKind.AmpersandToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.BarToken,
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.SlashToken
]);
const STRING_COMPARISON_OPERATORS = new Set([
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken
]);
const BUSINESS_NUMERIC_ATTRIBUTES = new Set(["max", "min", "step"]);
const INLINE_MEMBERSHIP_METHODS = new Set(["includes", "indexOf"]);
const SUPPRESSION_PATTERN = /@ts-(?:ignore|nocheck)|eslint-disable|biome-ignore/gu;
const ABSOLUTE_URL_PATTERN = /https?:\/\//u;

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(entryPath));
      continue;
    }

    const extension = path.extname(entry.name);
    if (
      SOURCE_EXTENSIONS.has(extension) &&
      !entry.name.includes(".test.") &&
      !entry.name.includes(".spec.")
    ) {
      files.push(entryPath);
    }
  }

  return files;
}

function report(findings, sourceFile, node, message) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  findings.push({
    column: position.character + 1,
    file: path.isAbsolute(sourceFile.fileName)
      ? path.relative(ROOT, sourceFile.fileName)
      : sourceFile.fileName,
    line: position.line + 1,
    message
  });
}

function isStringLiteral(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function isTypeofComparison(node, literalNode) {
  const otherNode = node.left === literalNode ? node.right : node.left;
  return ts.isTypeOfExpression(otherNode);
}

function numericValue(node) {
  if (ts.isNumericLiteral(node)) {
    return Number(node.text.replaceAll("_", ""));
  }
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return -Number(node.operand.text.replaceAll("_", ""));
  }
  return null;
}

function isInsideNamedConstant(node) {
  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isVariableDeclaration(current) && current.initializer) {
      const declarationList = current.parent;
      const isConst =
        ts.isVariableDeclarationList(declarationList) &&
        (declarationList.flags & ts.NodeFlags.Const) !== 0;
      return isConst && ts.isIdentifier(current.name) && /^[A-Z][A-Z0-9_]*$/u.test(current.name.text);
    }
    if (ts.isFunctionLike(current) || ts.isClassLike(current)) {
      return false;
    }
    current = current.parent;
  }
  return false;
}

function jsxAttributeName(node) {
  const expression = node.parent;
  const attribute = expression && ts.isJsxExpression(expression) ? expression.parent : null;
  return attribute && ts.isJsxAttribute(attribute) ? attribute.name.getText() : null;
}

function shouldReportNumber(node) {
  const value = numericValue(node);
  if (value === null || ALLOWED_NUMBERS.has(value) || isInsideNamedConstant(node)) {
    return false;
  }

  const parent = ts.isPrefixUnaryExpression(node.parent) ? node.parent.parent : node.parent;
  if (ts.isEnumMember(parent) || ts.isLiteralTypeNode(parent)) {
    return false;
  }

  const attributeName = jsxAttributeName(node);
  if (attributeName !== null) {
    return BUSINESS_NUMERIC_ATTRIBUTES.has(attributeName);
  }

  if (ts.isBinaryExpression(parent) && LOGIC_OPERATORS.has(parent.operatorToken.kind)) {
    return true;
  }
  if (ts.isCallExpression(parent) && parent.arguments.includes(node)) {
    return true;
  }

  return true;
}

function inspectNode(findings, sourceFile, node, allowAbsoluteUrls) {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    INLINE_MEMBERSHIP_METHODS.has(node.expression.name.text) &&
    ts.isArrayLiteralExpression(node.expression.expression) &&
    node.expression.expression.elements.some(isStringLiteral)
  ) {
    report(
      findings,
      sourceFile,
      node,
      "Do not perform domain membership checks against an inline string array. Use a named typed Set, map, or predicate."
    );
  }

  if (ts.isBinaryExpression(node) && STRING_COMPARISON_OPERATORS.has(node.operatorToken.kind)) {
    for (const operand of [node.left, node.right]) {
      if (
        isStringLiteral(operand) &&
        operand.text !== "" &&
        !isTypeofComparison(node, operand)
      ) {
        report(
          findings,
          sourceFile,
          operand,
          `Do not compare business logic to the hardcoded string ${JSON.stringify(operand.text)}. Use a named constant, union-backed map, or predicate.`
        );
      }
    }
  }

  if (ts.isCaseClause(node) && isStringLiteral(node.expression)) {
    report(
      findings,
      sourceFile,
      node.expression,
      `Do not switch on the hardcoded string ${JSON.stringify(node.expression.text)}. Use a named constant or typed map.`
    );
  }

  if ((ts.isNumericLiteral(node) || ts.isPrefixUnaryExpression(node)) && shouldReportNumber(node)) {
    report(
      findings,
      sourceFile,
      node,
      `Magic number ${node.getText(sourceFile)} is used in logic. Extract a named constant with units or domain meaning.`
    );
  }

  if (!allowAbsoluteUrls && isStringLiteral(node) && ABSOLUTE_URL_PATTERN.test(node.text)) {
    report(
      findings,
      sourceFile,
      node,
      "Absolute URLs must live in a configuration or constants module, not inline application logic."
    );
  }

  ts.forEachChild(node, (child) => inspectNode(findings, sourceFile, child, allowAbsoluteUrls));
}

export function analyzeSource(file, sourceText, allowAbsoluteUrls = false) {
  const findings = [];
  const scriptKind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, scriptKind);

  for (const match of sourceText.matchAll(SUPPRESSION_PATTERN)) {
    const position = sourceFile.getLineAndCharacterOfPosition(match.index);
    findings.push({
      column: position.character + 1,
      file: path.isAbsolute(file) ? path.relative(ROOT, file) : file,
      line: position.line + 1,
      message: `Quality-gate suppression ${JSON.stringify(match[0])} is not allowed. Fix the rule violation or change the shared rule with justification.`
    });
  }

  inspectNode(findings, sourceFile, sourceFile, allowAbsoluteUrls);
  return findings;
}

async function scanRepository() {
  const findings = [];
  for (const sourceRoot of SOURCE_ROOTS) {
    const absoluteRoot = path.join(ROOT, sourceRoot);
    for (const file of await collectSourceFiles(absoluteRoot)) {
      const sourceText = await readFile(file, "utf8");
      const relativeFile = path.relative(ROOT, file);
      const allowAbsoluteUrls = relativeFile.startsWith(`src${path.sep}constants${path.sep}`);
      findings.push(...analyzeSource(file, sourceText, allowAbsoluteUrls));
    }
  }

  return findings.sort((left, right) =>
    left.file.localeCompare(right.file) || left.line - right.line || left.column - right.column
  );
}

async function main() {
  const findings = await scanRepository();

  if (findings.length > 0) {
    console.error("AI code guard found policy violations:\n");
    for (const finding of findings) {
      console.error(`${finding.file}:${finding.line}:${finding.column} ${finding.message}`);
    }
    console.error(`\n${findings.length} violation(s) found.`);
    process.exitCode = 1;
  } else {
    console.log("AI code guard passed.");
  }
}

const entryUrl = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (entryUrl === import.meta.url) {
  await main();
}
