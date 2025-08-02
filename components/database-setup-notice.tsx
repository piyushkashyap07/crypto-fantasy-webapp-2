"use client"

import { AlertTriangle, Database } from "lucide-react"

export default function DatabaseSetupNotice() {
  const sqlScript = `-- Create the prize_pools table
CREATE TABLE IF NOT EXISTS prize_pools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  entry_fee DECIMAL(10,2) NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  duration_minutes INTEGER NOT NULL,
  prize_pool_size DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prize_pools_status ON prize_pools(status);
CREATE INDEX IF NOT EXISTS idx_prize_pools_created_at ON prize_pools(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE prize_pools ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing public access for demo)
CREATE POLICY "Anyone can view prize pools" ON prize_pools
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert prize pools" ON prize_pools
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update prize pools" ON prize_pools
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete prize pools" ON prize_pools
  FOR DELETE USING (true);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prize_pools_updated_at 
  BEFORE UPDATE ON prize_pools 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    alert("SQL script copied to clipboard!")
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mx-4 mb-6">
      <div className="flex items-start space-x-4">
        <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Database Setup Required</h3>
          <p className="text-yellow-700 mb-4">
            The prize pools table hasn't been created yet. Please run the SQL script below in your Supabase database to
            set up the required table structure.
          </p>

          <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">SQL Script</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition-colors"
              >
                Copy Script
              </button>
            </div>
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-x-auto max-h-40">
              <code>{sqlScript}</code>
            </pre>
          </div>

          <div className="text-sm text-yellow-700">
            <p className="font-medium mb-1">Steps to set up:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy and paste the script above</li>
              <li>Click "Run" to execute the script</li>
              <li>Refresh this page to start using prize pools</li>
            </ol>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> This demo uses open policies for easy testing. In production, you should implement
              proper authentication and restrict access to admin users only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
