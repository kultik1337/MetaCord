import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iewuxkukojdponnyfxyv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld3V4a3Vrb2pkcG9ubnlmeHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDgxNjYsImV4cCI6MjA4OTg4NDE2Nn0.oVTLBOxSGYxIneGZ-WL-BUe_ny7QLU1Mzj8tymnAEB0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
