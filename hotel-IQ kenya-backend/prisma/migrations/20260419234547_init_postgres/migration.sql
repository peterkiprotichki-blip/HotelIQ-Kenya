-- CreateEnum
CREATE TYPE "RentiumUserRole" AS ENUM ('super_admin', 'admin', 'manager', 'agent', 'tenant');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('view_dashboard', 'view_properties', 'create_properties', 'edit_properties', 'delete_properties', 'view_tenants', 'create_tenants', 'edit_tenants', 'delete_tenants', 'view_leases', 'create_leases', 'edit_leases', 'delete_leases', 'sign_lease', 'view_payments', 'create_payments', 'edit_payments', 'delete_payments', 'view_damages', 'create_damages', 'edit_damages', 'delete_damages', 'view_reports', 'export_reports', 'view_users', 'create_users', 'edit_users', 'delete_users', 'create_maintenance_requests', 'view_maintenance_requests', 'edit_maintenance_requests');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "FieldStage" AS ENUM ('planted', 'growing', 'ready', 'harvested');

-- CreateEnum
CREATE TYPE "FieldStatus" AS ENUM ('active', 'at_risk', 'completed');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('credentials', 'google', 'local');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "role" "RentiumUserRole" NOT NULL DEFAULT 'agent',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedPropertyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "googleId" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT NOT NULL DEFAULT '',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'credentials',
    "tenantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activeTenantId" TEXT NOT NULL DEFAULT '',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "plan" "TenantPlan" NOT NULL DEFAULT 'free',
    "settings" JSONB,
    "ownerUserId" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "billingEmail" TEXT NOT NULL DEFAULT '',
    "maxUsers" INTEGER NOT NULL DEFAULT 0,
    "maxProperties" INTEGER NOT NULL DEFAULT 0,
    "mpesaClientId" TEXT NOT NULL DEFAULT '',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "currentStage" "FieldStage" NOT NULL DEFAULT 'planted',
    "status" "FieldStatus" NOT NULL DEFAULT 'active',
    "assignedAgentId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "areaSize" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL DEFAULT '',
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expectedHarvestDate" TIMESTAMP(3),
    "updatedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_activeTenantId_idx" ON "User"("activeTenantId");

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_ownerUserId_idx" ON "Tenant"("ownerUserId");

-- CreateIndex
CREATE INDEX "Tenant_isActive_idx" ON "Tenant"("isActive");

-- CreateIndex
CREATE INDEX "Tenant_isDeleted_idx" ON "Tenant"("isDeleted");

-- CreateIndex
CREATE INDEX "Field_assignedAgentId_idx" ON "Field"("assignedAgentId");

-- CreateIndex
CREATE INDEX "Field_isDeleted_idx" ON "Field"("isDeleted");
