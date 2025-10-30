// PayslipGenerator.tsx - Enhanced version with proper PDF generation
import React from 'react';
import { Download } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import html2pdf from 'html2pdf.js';

interface PayslipGeneratorProps {
    payrollData: any;
    className?: string;
    buttonText?: string;
    variant?: 'html' | 'pdf' | 'both';
}

class PayslipGenerator {
    // Function to convert number to words (for Indian currency)
    static numberToWords(num: number): string {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num === 0) return 'Zero';

        const convert = (n: number): string => {
            if (n < 10) return ones[n];
            else if (n >= 10 && n < 20) return teens[n - 10];
            else if (n >= 20 && n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
            else if (n >= 100 && n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
            else if (n >= 1000 && n < 100000) {
                return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
            } else if (n >= 100000 && n < 10000000) {
                return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
            } else {
                return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
            }
        };

        const integerPart = Math.floor(num);
        const decimalPart = Math.round((num - integerPart) * 100);

        let result = convert(integerPart) + ' Rupees';
        if (decimalPart > 0) {
            result += ' and ' + convert(decimalPart) + ' Paise';
        }
        result += ' Only';

        return result;
    }

    // Function to generate HTML content for payslip (existing)
    static generatePayslipHTML(payroll: any): string {
        const employeeName = payroll.employeeId?.userId
            ? `${payroll.employeeId.userId.firstName || ''} ${payroll.employeeId.userId.lastName || ''}`.trim()
            : 'N/A';

        const employeeId = payroll.employeeId?.employeeId || 'N/A';
        const department = payroll.employeeId?.userId?.department?.name || 'N/A';
        const designation = payroll.employeeId?.designation || department;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[payroll.month - 1] || 'N/A';

        // Calculate earnings
        const basicSalary = Number(payroll.salaryStructure?.basic || 0);
        const hra = Number(payroll.salaryStructure?.hra || 0);
        const allowances = Number(payroll.salaryStructure?.allowances || 0);
        const bonus = Number(payroll.salaryStructure?.bonus || 0);
        const overtime = Number(payroll.salaryStructure?.overtime || 0);
        const otherEarnings = Number(payroll.salaryStructure?.otherEarnings || 0);
        const grossSalary = Number(payroll.grossSalary || 0);

        // Process deductions
        const deductions = payroll.deductions || [];
        const totalDeductions = Number(payroll.totalDeductions || 0);
        const netSalary = Number(payroll.netSalary || 0);

        const amountInWords = PayslipGenerator.numberToWords(netSalary);
        const payDate = payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : new Date().toLocaleDateString();
        const joiningDate = payroll.employeeId?.joiningDate
            ? new Date(payroll.employeeId.joiningDate).toLocaleDateString()
            : '01-Jan-2024';

        // Calculate paid days (assuming 30 days month)
        const paidDays = 30;
        const lopDays = 0;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Salary Slip - September 2025</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .payslip-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #333;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .header {
            background: #16243d;
            color: white;
            padding: 15px 20px;
            text-align: center;
        }
        
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-address {
            font-size: 14px;
            line-height: 1.4;
        }
        
        .payslip-title {
            display: grid;
            grid-template-columns: 1fr auto;
            padding: 15px 20px;
            border-bottom: 1px solid #ccc;
            font-weight: bold;
        }
        
        .employee-summary {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            border-bottom: 2px solid #333;
        }
        
        .summary-header {
            background: #f0f0f0;
            padding: 10px;
            font-weight: bold;
            border-right: 1px solid #ccc;
            text-align: center;
        }
        
        .net-pay-header {
            background: #f0f0f0;
            padding: 10px;
            font-weight: bold;
            text-align: center;
        }
        
        .employee-info {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
        }
        
        .info-row {
            display: contents;
        }
        
        .info-cell {
            padding: 8px 10px;
            border-right: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            font-size: 14px;
        }
        
        .info-cell:last-child {
            border-right: none;
        }
        
        .info-label {
            font-weight: bold;
        }
        
        .net-pay-value {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .earnings-deductions {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            border-top: 2px solid #333;
        }
        
        .section-header {
            background: #f0f0f0;
            padding: 10px;
            font-weight: bold;
            border-right: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            text-align: center;
        }
        
        .section-header:last-child {
            border-right: none;
        }
        
        .earnings-row {
            display: contents;
        }
        
        .earning-cell, .deduction-cell {
            padding: 8px 10px;
            border-right: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            font-size: 14px;
        }
        
        .earning-cell:nth-child(2n), .deduction-cell:nth-child(2n) {
            text-align: right;
        }
        
        .earning-cell:nth-child(4n), .deduction-cell:nth-child(4n) {
            border-right: none;
        }
        
        .total-row {
            background: #f9f9f9;
            font-weight: bold;
        }
        
        .net-pay-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-top: 2px solid #333;
            background: #f0f0f0;
        }
        
        .net-pay-label {
            padding: 15px;
            font-weight: bold;
            font-size: 16px;
            border-right: 1px solid #ccc;
            text-align: center;
        }
        
        .net-pay-amount {
            padding: 15px;
            font-weight: bold;
            font-size: 18px;
            text-align: center;
        }
        
        .amount-words {
            padding: 15px 20px;
            border-top: 1px solid #ccc;
            font-style: italic;
        }
        
        .footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-top: 2px solid #333;
        }
        
        .footer-section {
            padding: 15px;
            border-right: 1px solid #ccc;
            text-align: center;
        }
        
        .footer-section:last-child {
            border-right: none;
        }
        
        .footer-label {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .payslip-container {
                box-shadow: none;
                border: 1px solid #333;
            }
        }
    </style>
</head>
<body>
    <div class="payslip-container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">Biz-Hashtag Solutions India Private Limited</div>
            <div class="company-address">
                Godrej Genesis, Plot no XI, Block-EP & GP,<br>
                Sector-V, Kolkata - 700091
            </div>
        </div>
        
        <!-- Payslip Title -->
        <div class="payslip-title">
            <div>Payslip for the Month of September 2025</div>
            <div>Emp ID: HBS024</div>
        </div>
        
        <!-- Employee Summary Header -->
        <div class="employee-summary">
            <div class="summary-header" style="grid-column: span 2;">Employee Pay Summary</div>
            <div class="net-pay-header">Employee Net Pay</div>
        </div>
        
        <!-- Employee Information -->
        <div class="employee-info">
            <div class="info-row">
                <div class="info-cell">
                    <span class="info-label">Employee Name:</span> Shaheen Akhtar
                </div>
                <div class="info-cell">
                    <span class="info-label">Paid Days:</span> 30
                </div>
                <div class="info-cell net-pay-value" style="grid-row: span 6;">
                    ₹17350.00
                </div>
            </div>
            <div class="info-row">
                <div class="info-cell">
                    <span class="info-label">Designation:</span> Administration
                </div>
                <div class="info-cell">
                    <span class="info-label">LOP:</span> 0
                </div>
            </div>
            <div class="info-row">
                <div class="info-cell">
                    <span class="info-label">Date of Joining:</span> 01-Jan-2024
                </div>
                <div class="info-cell"></div>
            </div>
            <div class="info-row">
                <div class="info-cell">
                    <span class="info-label">Pay Period:</span> September 2025
                </div>
                <div class="info-cell"></div>
            </div>
            <div class="info-row">
                <div class="info-cell">
                    <span class="info-label">Pay Date:</span> 9/20/2025
                </div>
                <div class="info-cell"></div>
            </div>
            <div class="info-row">
                <div class="info-cell" style="border-bottom: 2px solid #333;">
                    <span class="info-label">Transaction ID:</span> 54654654
                </div>
                <div class="info-cell" style="border-bottom: 2px solid #333;"></div>
            </div>
        </div>
        
        <!-- Earnings and Deductions Header -->
        <div class="earnings-deductions">
            <div class="section-header">EARNINGS</div>
            <div class="section-header">AMOUNT</div>
            <div class="section-header">DEDUCTIONS</div>
            <div class="section-header">AMOUNT</div>
            
            <!-- Row 1 -->
            <div class="earning-cell">Basic Salary</div>
            <div class="earning-cell">₹10000.00</div>
            <div class="deduction-cell">pf</div>
            <div class="deduction-cell">₹2400.00</div>
            
            <!-- Row 2 -->
            <div class="earning-cell">House Rent Allowance</div>
            <div class="earning-cell">₹6000.00</div>
            <div class="deduction-cell">ptax</div>
            <div class="deduction-cell">₹130.00</div>
            
            <!-- Row 3 -->
            <div class="earning-cell">Allowances</div>
            <div class="earning-cell">₹4000.00</div>
            <div class="deduction-cell">esi</div>
            <div class="deduction-cell">₹150.00</div>
            
            <!-- Row 4 -->
            <div class="earning-cell">Bonus</div>
            <div class="earning-cell">₹10.00</div>
            <div class="deduction-cell"></div>
            <div class="deduction-cell"></div>
            
            <!-- Row 5 -->
            <div class="earning-cell">Overtime</div>
            <div class="earning-cell">₹10.00</div>
            <div class="deduction-cell"></div>
            <div class="deduction-cell"></div>
            
            <!-- Row 6 -->
            <div class="earning-cell">Other Earnings</div>
            <div class="earning-cell">₹10.00</div>
            <div class="deduction-cell"></div>
            <div class="deduction-cell"></div>
            
            <!-- Total Row -->
            <div class="earning-cell total-row">Gross Salary</div>
            <div class="earning-cell total-row">₹20000.00</div>
            <div class="deduction-cell total-row">Total Deductions</div>
            <div class="deduction-cell total-row">₹2680.00</div>
        </div>
        
        <!-- Net Pay Section -->
        <div class="net-pay-section">
            <div class="net-pay-label">NET PAY</div>
            <div class="net-pay-amount">₹17350.00</div>
        </div>
        
        <!-- Amount in Words -->
        <div class="amount-words">
            <strong>Amount in Words:</strong> Seventeen Thousand Three Hundred Fifty Rupees Only
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-section">
                <div class="footer-label">Generated On</div>
                <div>9/20/2025</div>
            </div>
            <div class="footer-section">
                <div class="footer-label">Authorized By</div>
                <div>HR Department</div>
            </div>
        </div>
    </div>
</body>
</html>
`;
    }

    static async generatePDFPayslip(payroll: any): Promise<void> {
        const htmlContent = PayslipGenerator.generatePayslipHTML(payroll);

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthName = monthNames[payroll.month - 1];
        const filename = `payslip_${monthName}_${payroll.year}_${payroll.employeeId?.employeeId || "employee"}.pdf`;

        await html2pdf()
            .set({
                margin: [0, 0, 0, 0],
                filename,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2, // Balanced scale for clarity and performance
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    backgroundColor: "#fff",
                    windowWidth: 595, // Match A4 width in px
                    windowHeight: 842 // Match A4 height in px
                },
                jsPDF: {
                    unit: "px",
                    format: [595, 842], // A4 size in px at 72 DPI
                    orientation: "portrait",
                    // compress: true
                }
            })
            .from(tempDiv)
            .save();

        document.body.removeChild(tempDiv);
    }

    // Function to download HTML payslip (existing)
    static downloadHTMLPayslip(payroll: any, filename?: string): void {
        const htmlContent = PayslipGenerator.generatePayslipHTML(payroll);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[payroll.month - 1];

        const defaultFilename = `payslip_${monthName}_${payroll.year}_${payroll.employeeId?.employeeId || 'employee'}.html`;

        link.href = url;
        link.download = filename || defaultFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Function to open payslip in new window for printing (existing)
    static openPayslipForPrint(payroll: any): void {
        const htmlContent = PayslipGenerator.generatePayslipHTML(payroll);
        const newWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');

        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            newWindow.focus();

            setTimeout(() => {
                newWindow.print();
            }, 1000);
        }
    }
}

// React component for easy integration
const PayslipDownloadButton: React.FC<PayslipGeneratorProps> = ({
    payrollData,
    className = '',
    buttonText = 'Download Payslip',
    variant = 'pdf'
}) => {
    const handleDownload = async () => {
        try {
            if (variant === 'html') {
                PayslipGenerator.downloadHTMLPayslip(payrollData);
            } else if (variant === 'pdf') {
                await PayslipGenerator.generatePDFPayslip(payrollData);
            } else if (variant === 'both') {
                const choice = window.confirm('Choose format:\nOK = PDF\nCancel = HTML');
                if (choice) {
                    await PayslipGenerator.generatePDFPayslip(payrollData);
                } else {
                    PayslipGenerator.downloadHTMLPayslip(payrollData);
                }
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download payslip. Please try again.');
        }
    };

    const handlePrint = () => {
        PayslipGenerator.openPayslipForPrint(payrollData);
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
                <Download className="w-4 h-4" />
                {buttonText}
            </button>

            <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
            >
                <Download className="w-4 h-4" />
                Print
            </button>
        </div>
    );
};

// Export both the class and component
export { PayslipGenerator };
export default PayslipDownloadButton;