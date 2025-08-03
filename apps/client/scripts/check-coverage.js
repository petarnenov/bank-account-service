#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration for minimum coverage thresholds
const COVERAGE_THRESHOLDS = {
	statements: 30,
	branches: 30,
	functions: 30,
	lines: 30
};

/**
 * Check if coverage meets the minimum thresholds
 * @param {Object} coverage - Coverage data from coverage-final.json
 * @returns {Object} - Results of coverage check
 */
function checkCoverage(coverage) {
	const results = {
		passed: true,
		details: {
			statements: { covered: 0, total: 0, percentage: 0 },
			branches: { covered: 0, total: 0, percentage: 0 },
			functions: { covered: 0, total: 0, percentage: 0 },
			lines: { covered: 0, total: 0, percentage: 0 }
		},
		failures: []
	};

	// Aggregate coverage data across all files
	Object.values(coverage).forEach(fileCoverage => {
		// Statements
		const statements = fileCoverage.s || {};
		const statementCount = Object.keys(statements).length;
		const coveredStatements = Object.values(statements).filter(count => count > 0).length;
		results.details.statements.total += statementCount;
		results.details.statements.covered += coveredStatements;

		// Branches
		const branches = fileCoverage.b || {};
		const branchCount = Object.keys(branches).length;
		const coveredBranches = Object.values(branches).filter(branchArray =>
			branchArray.some(count => count > 0)
		).length;
		results.details.branches.total += branchCount;
		results.details.branches.covered += coveredBranches;

		// Functions
		const functions = fileCoverage.f || {};
		const functionCount = Object.keys(functions).length;
		const coveredFunctions = Object.values(functions).filter(count => count > 0).length;
		results.details.functions.total += functionCount;
		results.details.functions.covered += coveredFunctions;

		// Lines (using statement map for line coverage approximation)
		const statementMap = fileCoverage.statementMap || {};
		const lineSet = new Set();
		Object.values(statementMap).forEach(stmt => {
			if (stmt.start && stmt.start.line) {
				lineSet.add(stmt.start.line);
			}
		});
		const totalLines = lineSet.size;
		const coveredLines = Object.entries(statements).filter(([key, count]) => {
			const stmt = statementMap[key];
			return count > 0 && stmt && stmt.start && stmt.start.line;
		}).length;

		results.details.lines.total += totalLines;
		results.details.lines.covered += coveredLines;
	});

	// Calculate percentages and check thresholds
	Object.keys(results.details).forEach(metric => {
		const detail = results.details[metric];
		detail.percentage = detail.total > 0 ? (detail.covered / detail.total) * 100 : 0;

		if (detail.percentage < COVERAGE_THRESHOLDS[metric]) {
			results.passed = false;
			results.failures.push({
				metric,
				actual: detail.percentage.toFixed(2),
				expected: COVERAGE_THRESHOLDS[metric],
				message: `${metric} coverage ${detail.percentage.toFixed(2)}% is below threshold ${COVERAGE_THRESHOLDS[metric]}%`
			});
		}
	});

	return results;
}

/**
 * Main function to run coverage check
 */
function main() {
	const coverageFilePath = path.join(__dirname, '..', 'coverage', 'coverage-final.json');

	try {
		// Check if coverage file exists
		if (!fs.existsSync(coverageFilePath)) {
			console.error('❌ Coverage file not found:', coverageFilePath);
			console.error('Please run tests with coverage first: npm run coverage');
			process.exit(1);
		}

		// Read and parse coverage data
		const coverageData = JSON.parse(fs.readFileSync(coverageFilePath, 'utf8'));

		// Check coverage
		const results = checkCoverage(coverageData);

		// Output results
		console.log('\n📊 Coverage Report Summary:');
		console.log('================================');

		Object.entries(results.details).forEach(([metric, detail]) => {
			const status = detail.percentage >= COVERAGE_THRESHOLDS[metric] ? '✅' : '❌';
			console.log(`${status} ${metric.padEnd(12)}: ${detail.percentage.toFixed(2)}% (${detail.covered}/${detail.total}) [threshold: ${COVERAGE_THRESHOLDS[metric]}%]`);
		});

		console.log('================================');

		if (results.passed) {
			console.log('🎉 All coverage thresholds met!');
			process.exit(0);
		} else {
			console.log('❌ Coverage check failed:');
			results.failures.forEach(failure => {
				console.log(`   - ${failure.message}`);
			});
			console.log('\nTo improve coverage:');
			console.log('   - Add more tests for uncovered code');
			console.log('   - Run: npm run coverage:open to see detailed coverage report');
			process.exit(1);
		}

	} catch (error) {
		console.error('❌ Error checking coverage:', error.message);
		process.exit(1);
	}
}

// Run the script if executed directly
if (require.main === module) {
	main();
}

module.exports = { checkCoverage, COVERAGE_THRESHOLDS };
