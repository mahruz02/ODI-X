import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://fwmigetbslnmqdoafrld.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const defaultUsers = [
  {
    email: "admin@odix.id",
    password: "Admin123!",
    name: "Super Admin ODI-X",
    role: "super_admin",
  },
  {
    email: "asesor@odix.id",
    password: "Asesor123!",
    name: "Asesor Organisasi",
    role: "org_admin",
  },
  {
    email: "analyst@odix.id",
    password: "Analyst123!",
    name: "Analis Data Diagnosis",
    role: "analyst",
  },
];

async function runSeed() {
  console.log("Seeding admin users to Supabase Auth & user_profiles...");
  const { data: existingList, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  for (const u of defaultUsers) {
    const existing = existingList?.users?.find((usr) => usr.email === u.email);
    let userId = "";

    if (existing) {
      console.log(`Updating user: ${u.email}...`);
      userId = existing.id;
      const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role },
      });
      if (updateErr) console.error(`Error updating auth for ${u.email}:`, updateErr.message);
    } else {
      console.log(`Creating user: ${u.email}...`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role },
      });
      if (createErr) {
        console.error(`Error creating ${u.email}:`, createErr.message);
        continue;
      }
      userId = newUser.user.id;
    }

    if (userId) {
      const { error: profErr } = await supabase.from("user_profiles").upsert({
        id: userId,
        email: u.email,
        name: u.name,
        role: u.role,
      });

      if (profErr) {
        console.error(`Error upserting profile for ${u.email}:`, profErr.message);
      } else {
        console.log(`✓ Profile synced for ${u.email} (${u.role})`);
      }
    }
  }

  console.log("\nSeeding completed successfully!");
}

runSeed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
