const { createClient } = require("@supabase/supabase-js");

const supabaseURL = process.env.SUPABASE_URL;
const supabaseKEY = process.env.SUPABASE_KEY;

if (!supabaseURL || !supabaseKEY) {
  throw new Error("Supabase URL and KEY must be provided in environment variables.");
}

const supabase = createClient(supabaseURL, supabaseKEY);

module.exports = supabase;
