const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const defaultUsers = [
  {
    name: 'SmartSeason Admin',
    email: 'admin@smartseason.com',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Agent One',
    email: 'agent1@smartseason.com',
    password: 'Agent@123',
    role: 'agent',
    permissions: ['view_dashboard', 'view_properties', 'edit_properties'],
  },
  {
    name: 'Agent Two',
    email: 'agent2@smartseason.com',
    password: 'Agent@123',
    role: 'agent',
    permissions: ['view_dashboard', 'view_properties', 'edit_properties'],
  },
];

function resolveSeedUsers() {
  const raw = process.env.SEED_USERS_JSON;
  if (!raw || !raw.trim()) {
    return defaultUsers;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return defaultUsers;
  } catch {
    return defaultUsers;
  }
}

function defaultPermissions(role) {
  if (role === 'admin' || role === 'super_admin') {
    return [
      'view_dashboard',
      'view_properties',
      'create_properties',
      'edit_properties',
      'delete_properties',
      'view_tenants',
      'create_tenants',
      'edit_tenants',
      'delete_tenants',
      'view_leases',
      'create_leases',
      'edit_leases',
      'delete_leases',
      'sign_lease',
      'view_payments',
      'create_payments',
      'edit_payments',
      'delete_payments',
      'view_damages',
      'create_damages',
      'edit_damages',
      'delete_damages',
      'view_reports',
      'export_reports',
      'view_users',
      'create_users',
      'edit_users',
      'delete_users',
      'create_maintenance_requests',
      'view_maintenance_requests',
      'edit_maintenance_requests',
    ];
  }

  return ['view_dashboard', 'view_properties', 'edit_properties'];
}

async function main() {
  const users = resolveSeedUsers();

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const permissions = Array.isArray(user.permissions) && user.permissions.length
      ? user.permissions
      : defaultPermissions(user.role);

    await prisma.user.upsert({
      where: { email: String(user.email).toLowerCase() },
      update: {
        name: String(user.name),
        password: hashedPassword,
        role: String(user.role),
        permissions,
        isActive: true,
        isApproved: true,
        isEmailVerified: true,
        isDeleted: false,
      },
      create: {
        name: String(user.name),
        email: String(user.email).toLowerCase(),
        password: hashedPassword,
        role: String(user.role),
        permissions,
        isActive: true,
        isApproved: true,
        isEmailVerified: true,
      },
    });
  }

  const count = await prisma.user.count({ where: { isDeleted: false } });
  console.log(`Seed complete. Active users: ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
