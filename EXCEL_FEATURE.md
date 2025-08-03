# Excel Download Feature for Prize Distribution

## Overview
This feature allows administrators to download Excel files containing prize distribution data for finished contests. The Excel file includes wallet addresses and prize amounts for all winners.

## Features

### Excel File Format
The generated Excel file contains the following columns:
- **Address/ENS/Cwallet_ID**: Participant's wallet address
- **Memo(optional)**: Always empty (as per requirements)
- **Amount**: Prize amount won by the participant
- **Remark**: User ID and rank information

### File Naming
Files are named as: `{PrizePoolName}_prize_distribution.xlsx`

### Access Location
The download button appears in the Admin Dashboard under the "Finished" tab for each completed prize pool.

## Technical Implementation

### Files Created/Modified

1. **`lib/excel-generator.ts`** - Core Excel generation logic
   - `generatePrizeDistributionExcel()` - Fetches data and creates Excel rows
   - `downloadExcelFile()` - Handles file download

2. **`components/download-excel-button.tsx`** - Download button component
   - Handles user interaction and error states
   - Shows loading state during generation

3. **`components/admin-prize-pool-tabs.tsx`** - Admin interface integration
   - Added download button to finished prize pools
   - Integrated with existing admin dashboard

4. **`package.json`** - Added xlsx dependency
   - Added `xlsx: ^0.18.5` for Excel file generation

### Data Flow

1. **User clicks "Download Excel"** on a finished prize pool
2. **System fetches final rankings** with prize amounts from `final_rankings` table
3. **Wallet addresses are retrieved** from `payments` table or `prize_pool_participants` table
4. **Excel file is generated** with proper formatting
5. **File is downloaded** to user's device

### Error Handling

- **No winners found**: Shows appropriate error message
- **Missing wallet addresses**: Uses "Unknown" as fallback
- **Network errors**: Shows user-friendly error messages
- **XLSX library failure**: Falls back to CSV format

### Security

- **Admin-only access**: Only authenticated admins can download files
- **Finished pools only**: Excel download only available for completed contests
- **Data validation**: Ensures only valid prize amounts are included

## Usage

1. Navigate to Admin Dashboard
2. Go to "Finished" tab
3. Find the desired prize pool
4. Click "Download Excel" button
5. File will be downloaded automatically

## Requirements

- Prize pool must be in "finished" status
- Must have winners with prize amounts > 0
- Admin authentication required
- Modern browser with download support

## Dependencies

- `xlsx: ^0.18.5` - Excel file generation
- Supabase - Database queries
- React - UI components 