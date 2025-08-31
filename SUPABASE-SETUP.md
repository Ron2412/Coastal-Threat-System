# 🚀 Supabase Setup Guide for Coastal Threat Dashboard

## 📋 **Prerequisites**
- Supabase account (free tier available)
- Your CSV dataset ready
- Node.js installed

## 🔧 **Step 1: Create Supabase Project**

1. **Go to [supabase.com](https://supabase.com)** and sign up/login
2. **Create New Project**
   - Choose organization
   - Enter project name: `coastal-threat-dashboard`
   - Enter database password (save this!)
   - Choose region closest to you
   - Wait for project to be ready (2-3 minutes)

## 🗄️ **Step 2: Set Up Database Schema**

1. **Open your Supabase project dashboard**
2. **Go to SQL Editor** (left sidebar)
3. **Copy and paste** the contents of `supabase-schema.sql`
4. **Click "Run"** to execute the schema
5. **Verify** the `coastal_locations` table was created

## 🔑 **Step 3: Get API Keys**

1. **Go to Settings → API** (left sidebar)
2. **Copy these values:**
   - **Project URL** (looks like: `https://xyz.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

## ⚙️ **Step 4: Configure Environment Variables**

1. **Create `.env` file** in the root directory:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Frontend Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

2. **Create `.env` file** in the `frontend/` directory:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
VITE_APP_TITLE=Coastal Threat Dashboard
```

## 📊 **Step 5: Upload Your CSV Data**

1. **Place your CSV file** in the root directory
2. **Update the upload script** (`upload-csv-to-supabase.js`):
   - Change `CSV_FILE_PATH` to your CSV filename
   - Update `COLUMN_MAPPING` to match your CSV columns
3. **Run the upload script**:
```bash
node upload-csv-to-supabase.js
```

## 🎯 **Step 6: Test the Integration**

1. **Start the frontend**:
```bash
cd frontend
npm run dev
```

2. **Open browser** to `http://localhost:3000`
3. **Check the console** for any errors
4. **Verify data** is loading from Supabase

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"Missing Supabase environment variables"**
   - Check your `.env` files exist
   - Verify variable names are correct

2. **"Invalid API key"**
   - Double-check your API keys
   - Ensure you're using the right keys (anon vs service_role)

3. **"Table doesn't exist"**
   - Run the schema.sql again
   - Check table name in Supabase dashboard

4. **"CSV parsing errors"**
   - Verify CSV file path
   - Check column mapping matches your CSV headers

### **CSV Format Requirements:**

Your CSV should have these columns (adjust mapping as needed):
```csv
Location_Name,Country,Latitude,Longitude,Region,Port_Type,Population,Risk_Level,Threats,Description
Mumbai,India,19.0760,72.8777,Arabian Sea,major_port,20.4M,high,"flooding,storm_surge,erosion",Major port city
```

## 🚀 **Next Steps**

After successful setup:
1. ✅ **Data is in Supabase**
2. ✅ **Frontend connects to Supabase**
3. 🎯 **Ready for ML model training!**

## 📚 **Useful Links**

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 **Need Help?**

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase dashboard shows your data
3. Check environment variables are loaded
4. Ensure CSV format matches expected structure
