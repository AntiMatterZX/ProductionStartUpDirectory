# LaunchPad Database Seeding Scripts

This directory contains scripts to seed the Venture Connect database with sample data.

## Setup

1. Navigate to this directory:
   ```
   cd scripts
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in this directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   
   > **Important**: The service role key has admin privileges. Never expose it in client-side code or commit it to version control.

## Running the Seeds

To seed sample startups into the database:

```
npm run seed
```

This will:
1. Create a demo user (if it doesn't exist)
2. Create 5 sample startups with realistic data
3. Generate social links for each startup
4. Add sample media (images) for each startup
5. Assign random "looking for" options to each startup

## Notes

- All sample startups will be created with the status "approved" so they will be immediately visible on the public listing.
- The sample startups cover different industries: CleanTech, HealthTech, AI, FoodTech, and Blockchain.
- The script uses [Lorem Picsum](https://picsum.photos) to generate random images for startup media.
- If you run the script multiple times, it will use the same demo user but create new startups each time.

## Customization

You can modify the sample data in `seed-startups.js` to create different types of startups. 