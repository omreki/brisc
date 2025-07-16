# Google Sheets Update Guide

This guide will help you update your Google Sheets to accommodate the new expanded results structure with 50 columns.

## Overview of Changes

The system has been updated to handle an expanded results structure that includes:
- New student information fields (Admission Number, Date of Birth)
- Overall grade information (Overall Grade Point, Overall Grade)
- Both full and abbreviated versions of subject names
- Total of 50 columns (A to AX in Google Sheets)

## Column Structure

### Sheet1 (Main Results Sheet)

Your main results sheet should have the following column structure:

| Column | Field Name | Description |
|--------|------------|-------------|
| A | examNumber | Student's exam number |
| B | admissionNumber | Student's admission number |
| C | name | Student's full name |
| D | dateOfBirth | Student's date of birth |
| E | oldTestamentSurvey | Old Testament Survey grade |
| F | newTestamentSurvey | New Testament Survey grade |
| G | prophets | Prophets grade |
| H | paulsMissionaryJourney | Paul's Missionary Journey grade |
| I | churchHistory | Church History grade |
| J | bookOfHebrew | Book of Hebrew grade |
| K | greekLanguage | Greek Language grade |
| L | bibleStudyMethod | Bible Study Method grade |
| M | bookOfRomans | Book of Romans grade |
| N | theBookOfJudges | The Book of Judges grade |
| O | abrahamsJourney | Abraham's Journey grade |
| P | kingsOfIsrael | Kings of Israel grade |
| Q | kingsOfJudah | Kings of Judah grade |
| R | epistles | Epistles grade |
| S | hebrewLanguage | Hebrew Language grade |
| T | theology | Theology grade |
| U | tabernacle | Tabernacle grade |
| V | theBookOfEzekiel | The Book of Ezekiel grade |
| W | theJourneyOfIsraelites | The Journey of Israelites grade |
| X | churchAdministration | Church Administration grade |
| Y | practicum | Practicum grade |
| Z | overallGradePoint | Overall Grade Point |
| AA | overallGrade | Overall Grade |
| AB | oldT | Old Testament (abbreviated) |
| AC | newT | New Testament (abbreviated) |
| AD | pro | Prophets (abbreviated) |
| AE | pauls | Paul's (abbreviated) |
| AF | hebrewL | Hebrew Language (abbreviated) |
| AG | hebrew | Hebrew (abbreviated) |
| AH | greekL | Greek Language (abbreviated) |
| AI | bibleStu | Bible Study (abbreviated) |
| AJ | bookOfRo | Book of Romans (abbreviated) |
| AK | theBookOfJu | The Book of Judges (abbreviated) |
| AL | abrahams | Abraham's (abbreviated) |
| AM | kingsOfIsr | Kings of Israel (abbreviated) |
| AN | kingsOfJu | Kings of Judah (abbreviated) |
| AO | epis | Epistles (abbreviated) |
| AP | churchHis | Church History (abbreviated) |
| AQ | theol | Theology (abbreviated) |
| AR | tabe | Tabernacle (abbreviated) |
| AS | theBookOfEze | The Book of Ezekiel (abbreviated) |
| AT | theJourneyOfIsra | The Journey of Israelites (abbreviated) |
| AU | churchAdmi | Church Administration (abbreviated) |
| AV | prac | Practicum (abbreviated) |
| AW | over | Overall (abbreviated) |
| AX | ref | Reference field |

## Setup Instructions

### Step 1: Update Header Row

1. Open your Google Sheets document
2. In row 1, add the following headers exactly as shown:

```
A1: examNumber
B1: admissionNumber
C1: name
D1: dateOfBirth
E1: oldTestamentSurvey
F1: newTestamentSurvey
G1: prophets
H1: paulsMissionaryJourney
I1: churchHistory
J1: bookOfHebrew
K1: greekLanguage
L1: bibleStudyMethod
M1: bookOfRomans
N1: theBookOfJudges
O1: abrahamsJourney
P1: kingsOfIsrael
Q1: kingsOfJudah
R1: epistles
S1: hebrewLanguage
T1: theology
U1: tabernacle
V1: theBookOfEzekiel
W1: theJourneyOfIsraelites
X1: churchAdministration
Y1: practicum
Z1: overallGradePoint
AA1: overallGrade
AB1: oldT
AC1: newT
AD1: pro
AE1: pauls
AF1: hebrewL
AG1: hebrew
AH1: greekL
AI1: bibleStu
AJ1: bookOfRo
AK1: theBookOfJu
AL1: abrahams
AM1: kingsOfIsr
AN1: kingsOfJu
AO1: epis
AP1: churchHis
AQ1: theol
AR1: tabe
AS1: theBookOfEze
AT1: theJourneyOfIsra
AU1: churchAdmi
AV1: prac
AW1: over
AX1: ref
```

### Step 2: Update Existing Data

1. **Important**: Back up your existing data before making changes
2. If you have existing student data, you'll need to add the new columns:
   - Insert columns B and D for `admissionNumber` and `dateOfBirth`
   - Add columns Z and AA for overall grades
   - Add columns AB through AW for abbreviated subjects
3. Fill in the new fields with appropriate data or leave blank if not available

### Step 3: Data Format Guidelines

- **Exam Number**: Unique identifier for each student
- **Admission Number**: Student's admission number in your institution
- **Name**: Full student name
- **Date of Birth**: Format as YYYY-MM-DD or MM/DD/YYYY
- **Grades**: Use consistent grading format (A+, A, B+, etc.)
- **Overall Grade Point**: Numerical or letter grade
- **Overall Grade**: Final computed grade
- **Abbreviated Fields**: Can be the same as full fields or shortened versions

### Step 4: Required Sheets

Make sure your Google Sheets document contains these sheets:

1. **Sheet1**: Main results data (as described above)
2. **Users**: User account information
3. **UserResults**: Saved user results
4. **Payments**: Payment records
5. **PasswordResetTokens**: Password reset tokens

### Step 5: Test the Integration

1. Save your changes to the Google Sheets
2. Test the system by looking up an exam number
3. Verify that all fields are displaying correctly
4. Check that PDF generation includes all new fields

## Data Migration Tips

### If You Have Existing Data:

1. **Create a backup** of your current sheet
2. **Export current data** to CSV
3. **Reorganize data** to match the new column structure
4. **Import the reorganized data** back to Google Sheets
5. **Fill in missing fields** with appropriate default values

### For New Implementations:

1. Create the sheet with the new structure from the start
2. Populate sample data to test the system
3. Ensure all required fields have values

## Troubleshooting

### Common Issues:

1. **"Column not found" errors**: Ensure column headers match exactly
2. **Missing data in results**: Check that exam numbers match exactly
3. **PDF generation issues**: Verify that all required fields have values
4. **API validation errors**: Ensure no fields are completely empty

### Best Practices:

1. Use consistent data formats across all columns
2. Avoid special characters in exam numbers
3. Keep grade values consistent (all A+ format or all numerical)
4. Regular backup of your Google Sheets data
5. Test with a small dataset before full deployment

## Need Help?

If you encounter issues during the migration:

1. Check that your Google Sheets API credentials are properly configured
2. Verify that the sheet has the correct permissions
3. Ensure all environment variables are set correctly
4. Test with a single exam number first before processing bulk data

The system now supports 50 fields total, providing comprehensive tracking of student results with both detailed and abbreviated subject information. 