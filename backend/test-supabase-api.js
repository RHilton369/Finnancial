const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://qdgnuwvtgyodtpcefufy.supabase.co';
const supabaseKey = 'sb_publishable_k-PNP1_yMpAs18KuAO9CHg_90ZUvh5_';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('User').select('count', { count: 'exact', head: true });
  if (error) {
    console.error('Supabase API error:', error.message);
  } else {
    console.log('Supabase API success, count:', data);
  }
}

test();
