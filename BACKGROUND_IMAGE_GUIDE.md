# 📄 Background Image PDF Generator Guide

## Overview

The PDF generator has been completely redesigned to use your Zion Raju transcript template as a background image. The student results table will be positioned in the middle empty area of the template, with automatic page breaks when needed.

## 🚀 How It Works

### New Features:
- **Background Image**: Every page uses your transcript template as the background
- **Smart Positioning**: Student data table is positioned in the middle empty area
- **Multi-page Support**: Tables automatically split across pages when needed
- **Consistent Layout**: Each continuation page maintains the same background
- **Minimal Overlay**: Only essential data is overlaid on the template

## 📋 Step-by-Step Setup

### Step 1: Convert Your Image to Base64

1. Open `IMAGE_TO_BASE64_CONVERTER.html` in your web browser
2. Upload your Zion Raju transcript template image
3. Copy the generated base64 string

### Step 2: Update the PDF Generator

1. Open `src/utils/pdfGenerator.ts`
2. Find the `TRANSCRIPT_TEMPLATE_BASE64` constant (around line 25)
3. Replace the placeholder base64 string with your image's base64 string

```typescript
// Replace this with your actual image base64
const TRANSCRIPT_TEMPLATE_BASE64 = 'data:image/jpeg;base64,YOUR_ACTUAL_BASE64_STRING_HERE'
```

### Step 3: Adjust Positioning (if needed)

The layout is configured for the standard Zion Raju template. If you need to adjust positioning:

```typescript
// Page layout constants (adjust based on your template)
const tableStartY = 140 // Start of middle empty area
const tableEndY = 220   // End of middle empty area
const tableWidth = 160  // Width of table area
const leftMargin = 25   // Left margin for table
```

### Step 4: Customize Student Info Positioning

In the `addStudentInfoOverlay` function, adjust these values:

```typescript
const infoStartY = 120 // Adjust based on template layout
const leftMargin = 25

// Positions for different fields:
doc.text(`${studentData.name}`, leftMargin, infoStartY)
doc.text(`${studentData.dateOfBirth || 'N/A'}`, leftMargin, infoStartY + 10)
doc.text(`Bachelor of Theology`, leftMargin, infoStartY + 20)
doc.text(`${studentData.admissionNumber || examNumber}`, leftMargin, infoStartY + 30)
doc.text(`${examNumber}`, 160, infoStartY) // S.NO position
```

## 🎯 Layout Configuration

### Template Areas:

1. **Header Area** (0-120mm): Template header with institution info
2. **Student Info Area** (120-140mm): Student details overlay
3. **Academic Records Area** (140-220mm): Results table
4. **Footer Area** (220-297mm): Template footer with signatures

### Table Configuration:

```typescript
columnStyles: {
  0: { halign: 'left', cellWidth: 70 },   // Subject Title
  1: { halign: 'center', cellWidth: 25 }, // Subject Code
  2: { halign: 'center', cellWidth: 20 }, // Credit Hours
  3: { halign: 'center', cellWidth: 22 }, // Grade Point
  4: { halign: 'center', cellWidth: 23 }  // Grade
}
```

## 🔧 Customization Options

### 1. Table Styling

To modify table appearance:

```typescript
styles: {
  fontSize: 8,
  cellPadding: 3,
  halign: 'center',
  valign: 'middle'
},
headStyles: {
  fillColor: [255, 255, 255], // White background
  textColor: [0, 0, 0],        // Black text
  fontSize: 9,
  fontStyle: 'bold'
},
bodyStyles: {
  fillColor: [255, 255, 255],  // White background
  textColor: [0, 0, 0]         // Black text
}
```

### 2. Page Breaks

The system automatically handles page breaks:

```typescript
didDrawPage: function(data: any) {
  // Ensure table doesn't go beyond the designated area
  if (data.cursor.y > tableEndY) {
    doc.addPage()
    addBackgroundImage(doc, bgImage)
  }
}
```

### 3. Summary Information

Summary is added only on the last page:

```typescript
if (pageIndex === pageData.length - 1) {
  const summaryY = Math.min((doc as any).lastAutoTable.finalY + 10, tableEndY - 20)
  const summaryText = `Total Credits: ${totalCredits} | GPA: ${finalGPA} | Grade: ${finalOverallGrade}`
  doc.text(summaryText, 105, summaryY, { align: 'center' })
}
```

## 🧪 Testing the Setup

### Test with Sample Data:

1. Start your development server: `npm run dev`
2. Navigate to exam lookup page
3. Use test exam number: `ZIPC2024001`
4. Generate PDF to verify background image and positioning

### Expected Results:

- ✅ Background image appears on all pages
- ✅ Student info overlays correctly in designated areas
- ✅ Academic records table fits in middle empty area
- ✅ Multiple pages work if student has many subjects
- ✅ Summary appears on last page

## 🎨 Advanced Customizations

### Adding Custom Overlays:

```typescript
function addCustomOverlay(doc: any, studentData: StudentResult) {
  doc.setFontSize(10)
  doc.setTextColor(255, 0, 0) // Red color
  doc.text('CONFIDENTIAL', 105, 280, { align: 'center' })
}
```

### Different Templates by Student Type:

```typescript
export async function generatePDF(
  studentData: StudentResult, 
  examNumber: string, 
  backgroundImageBase64?: string,
  templateType?: 'undergraduate' | 'graduate'
) {
  const bgImage = templateType === 'graduate' 
    ? GRADUATE_TEMPLATE_BASE64 
    : backgroundImageBase64 || TRANSCRIPT_TEMPLATE_BASE64
  // ... rest of function
}
```

## 🚨 Troubleshooting

### Common Issues:

1. **Image Not Displaying**
   - Check base64 string is complete
   - Verify image format (JPEG/PNG supported)
   - Check console for errors

2. **Text Positioning Off**
   - Adjust `tableStartY`, `tableEndY` values
   - Modify `infoStartY` for student info
   - Check template dimensions

3. **Table Too Large**
   - Reduce `fontSize` in table styles
   - Adjust `cellWidth` values
   - Modify `tableWidth` constant

4. **Performance Issues**
   - Compress image before converting to base64
   - Consider using smaller image dimensions
   - Optimize base64 string size

### Debug Mode:

Add debug indicators to see positioning:

```typescript
// Add debug rectangles to visualize areas
doc.setDrawColor(255, 0, 0) // Red
doc.rect(leftMargin, tableStartY, tableWidth, tableEndY - tableStartY)
```

## 📝 Notes

- Image should be high resolution for best quality
- Base64 strings can be large - consider image optimization
- PDF file size will increase with background images
- Test with various student record lengths
- Ensure template matches your official format

## 🔄 Updates and Maintenance

When updating the template:

1. Convert new image to base64
2. Update `TRANSCRIPT_TEMPLATE_BASE64` constant
3. Test positioning with sample data
4. Adjust layout constants if needed
5. Deploy and verify in production

---

**Ready to use!** Your PDF generator now creates professional transcripts with your official template as the background. 