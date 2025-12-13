/**
 * Calculate PAYE Tax based on FIRS Guidelines (2025)
 * 
 * @param {number} basicSalary - Annual Basic Salary
 * @param {number} housingAllowance - Annual Housing Allowance
 * @param {number} transportAllowance - Annual Transport Allowance
 * @param {number} otherAllowances - Total of other taxable allowances
 * @returns {object} Breakdown of tax, pension, NHF, CRA, and independent tax
 */
const calculatePAYE = (basicSalary, housingAllowance = 0, transportAllowance = 0, otherAllowances = 0) => {
    // 1. Calculate Gross Income
    const grossIncome = basicSalary + housingAllowance + transportAllowance + otherAllowances;

    // 2. Calculate Statutory Deductions (Tax Exempt)

    // Pension: 8% of (Basic + Housing + Transport) according to Pension Reform Act
    // If breakdown not fully available, usually calculated on Gross or Basic+Housing+Transport 
    // We will use strict (Basic + Housing + Transport) as per default standard.
    // If allowances are lumped, we might fallback to a simplified base, but let's assume inputs are somewhat separated or we lump them wisely.
    // For specific requirement "8% of Gross", we can use that if user insisted, but standard is (B+H+T). 
    // User prompted "8% of Gross" in previous turn confirmation. I will use 8% of Gross as per user Implementation Plan acceptance.
    const pension = grossIncome * 0.08;

    // NHF: 2.5% of Basic Salary
    const nhf = basicSalary * 0.025;

    // NHIS: Optional, usually 5% if applicable. We will assume 0 for now as it wasn't specified mandatory.
    const nhis = 0;

    // Total Statutory Reliefs
    const statutoryReliefs = pension + nhf + nhis;

    // 3. Consolidated Relief Allowance (CRA)
    // Higher of (₦200,000 or 1% of Gross) + 20% of Gross
    const effectiveGross = grossIncome; // Income for CRA calculation purposes
    const onePercentGross = effectiveGross * 0.01;
    const fixedRelief = 200000;
    const higherRelief = Math.max(fixedRelief, onePercentGross);
    const cra = higherRelief + (effectiveGross * 0.20);

    // 4. Taxable Income
    // Gross - (Statutory Reliefs + CRA)
    let taxableIncome = grossIncome - statutoryReliefs - cra;

    // Minimum Tax Rule:
    // If Taxable Income is negative or results in tax lower than min tax.
    // Minimum Tax = 1% of Gross Income.
    const minimumTax = grossIncome * 0.01;

    if (taxableIncome <= 0) {
        return {
            grossIncome,
            taxableIncome: 0,
            tax: minimumTax,
            pension,
            nhf,
            cra,
            isMinimumTax: true
        };
    }

    // 5. Calculate Tax using Bands (Annual Rates)
    let tax = 0;
    let incomeToTax = taxableIncome;

    // Band 1: First 300,000 @ 7%
    if (incomeToTax > 300000) {
        tax += 300000 * 0.07;
        incomeToTax -= 300000;
    } else {
        tax += incomeToTax * 0.07;
        incomeToTax = 0;
    }

    // Band 2: Next 300,000 @ 11%
    if (incomeToTax > 0) {
        if (incomeToTax > 300000) {
            tax += 300000 * 0.11;
            incomeToTax -= 300000;
        } else {
            tax += incomeToTax * 0.11;
            incomeToTax = 0;
        }
    }

    // Band 3: Next 500,000 @ 15%
    if (incomeToTax > 0) {
        if (incomeToTax > 500000) {
            tax += 500000 * 0.15;
            incomeToTax -= 500000;
        } else {
            tax += incomeToTax * 0.15;
            incomeToTax = 0;
        }
    }

    // Band 4: Next 500,000 @ 19%
    if (incomeToTax > 0) {
        if (incomeToTax > 500000) {
            tax += 500000 * 0.19;
            incomeToTax -= 500000;
        } else {
            tax += incomeToTax * 0.19;
            incomeToTax = 0;
        }
    }

    // Band 5: Next 1,600,000 @ 21%
    if (incomeToTax > 0) {
        if (incomeToTax > 1600000) {
            tax += 1600000 * 0.21;
            incomeToTax -= 1600000;
        } else {
            tax += incomeToTax * 0.21;
            incomeToTax = 0;
        }
    }

    // Band 6: Above 3,200,000 @ 24%
    if (incomeToTax > 0) {
        tax += incomeToTax * 0.24;
    }

    // Check against Minimum Tax
    if (tax < minimumTax) {
        tax = minimumTax;
    }

    return {
        grossIncome,
        taxableIncome,
        tax,
        pension,
        nhf,
        cra,
        isMinimumTax: tax === minimumTax
    };
};

module.exports = { calculatePAYE };
