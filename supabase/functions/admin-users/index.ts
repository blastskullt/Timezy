import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'professional';
  professionalId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify the user making the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is admin by calling the get_user_role function
    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('get_user_role', { user_id: user.id });

    if (roleError || roleData !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin access required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // List users
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          throw listError;
        }

        return new Response(
          JSON.stringify({ users: users.users || [] }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      case 'POST':
        // Create user
        const createUserData: CreateUserRequest = await req.json();
        
        if (!createUserData.email || !createUserData.password || !createUserData.name) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: email, password, name' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        if (createUserData.role === 'professional' && !createUserData.professionalId) {
          return new Response(
            JSON.stringify({ error: 'Professional ID is required for professional users' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: createUserData.email,
          password: createUserData.password,
          email_confirm: true,
          user_metadata: {
            name: createUserData.name,
            role: createUserData.role,
            professional_id: createUserData.role === 'professional' ? createUserData.professionalId : undefined
          }
        });

        if (createError) {
          throw createError;
        }

        return new Response(
          JSON.stringify({ user: newUser.user }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      case 'DELETE':
        // Delete user
        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');
        
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId parameter' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (deleteError) {
          throw deleteError;
        }

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Error in admin-users function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});