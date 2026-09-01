-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('draft', 'saved');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('hero', 'categories', 'productGrid', 'richText', 'contact', 'cta');

-- CreateEnum
CREATE TYPE "LinkTargetType" AS ENUM ('page', 'section', 'external', 'none');

-- CreateEnum
CREATE TYPE "ProductImageKind" AS ENUM ('placeholder', 'url');

-- CreateEnum
CREATE TYPE "ProductBadge" AS ENUM ('new', 'limited', 'bestseller');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "googleSub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "locale" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "StoreStatus" NOT NULL DEFAULT 'draft',
    "promptText" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "theme" JSONB NOT NULL,
    "navigation" JSONB NOT NULL,
    "header" JSONB NOT NULL,
    "footer" JSONB NOT NULL,
    "announcementBar" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "type" "SectionType" NOT NULL,
    "position" INTEGER NOT NULL,
    "background" TEXT NOT NULL,
    "container" TEXT NOT NULL,
    "paddingY" TEXT NOT NULL,
    "align" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_sections" (
    "sectionId" UUID NOT NULL,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT,
    "description" TEXT NOT NULL,
    "heroLayout" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "overlayStrength" INTEGER NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "ctaTargetType" "LinkTargetType" NOT NULL,
    "ctaTargetPageId" UUID,
    "ctaTargetSectionId" UUID,
    "ctaTargetUrl" TEXT,

    CONSTRAINT "hero_sections_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "categories_sections" (
    "sectionId" UUID NOT NULL,
    "title" TEXT,
    "categoriesLayout" TEXT NOT NULL,
    "columns" INTEGER NOT NULL,

    CONSTRAINT "categories_sections_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "product_grid_sections" (
    "sectionId" UUID NOT NULL,
    "title" TEXT,
    "productGridLayout" TEXT NOT NULL,
    "columns" INTEGER NOT NULL,
    "limit" INTEGER,
    "cardVariant" JSONB,
    "showViewAll" BOOLEAN NOT NULL,
    "categoryId" UUID,

    CONSTRAINT "product_grid_sections_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "rich_text_sections" (
    "sectionId" UUID NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "width" TEXT NOT NULL,

    CONSTRAINT "rich_text_sections_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "contact_sections" (
    "sectionId" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "showForm" BOOLEAN NOT NULL,
    "contactLayout" TEXT NOT NULL,

    CONSTRAINT "contact_sections_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "cta_sections" (
    "sectionId" UUID NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT,
    "ctaLayout" TEXT NOT NULL,
    "emphasis" TEXT NOT NULL,
    "buttonLabel" TEXT NOT NULL,
    "buttonTargetType" "LinkTargetType" NOT NULL,
    "buttonTargetPageId" UUID,
    "buttonTargetSectionId" UUID,
    "buttonTargetUrl" TEXT,

    CONSTRAINT "cta_sections_pkey" PRIMARY KEY ("sectionId")
);

-- CreateTable
CREATE TABLE "categories_section_items" (
    "sectionId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "categories_section_items_pkey" PRIMARY KEY ("sectionId","categoryId")
);

-- CreateTable
CREATE TABLE "product_grid_section_items" (
    "sectionId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "product_grid_section_items_pkey" PRIMARY KEY ("sectionId","productId")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "accentColor" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "imageKind" "ProductImageKind" NOT NULL,
    "imageRef" TEXT NOT NULL,
    "imageStyle" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "badge" "ProductBadge",
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_googleSub_key" ON "users"("googleSub");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "stores_userId_idx" ON "stores"("userId");

-- CreateIndex
CREATE INDEX "stores_userId_updatedAt_idx" ON "stores"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "stores_userId_slug_key" ON "stores"("userId", "slug");

-- CreateIndex
CREATE INDEX "pages_storeId_idx" ON "pages"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_storeId_slug_key" ON "pages"("storeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "pages_storeId_position_key" ON "pages"("storeId", "position");

-- CreateIndex
CREATE INDEX "sections_pageId_idx" ON "sections"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "sections_pageId_position_key" ON "sections"("pageId", "position");

-- CreateIndex
CREATE INDEX "categories_section_items_categoryId_idx" ON "categories_section_items"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_section_items_sectionId_position_key" ON "categories_section_items"("sectionId", "position");

-- CreateIndex
CREATE INDEX "product_grid_section_items_productId_idx" ON "product_grid_section_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_grid_section_items_sectionId_position_key" ON "product_grid_section_items"("sectionId", "position");

-- CreateIndex
CREATE INDEX "categories_storeId_idx" ON "categories"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_storeId_slug_key" ON "categories"("storeId", "slug");

-- CreateIndex
CREATE INDEX "products_storeId_idx" ON "products"("storeId");

-- CreateIndex
CREATE INDEX "products_storeId_categoryId_idx" ON "products"("storeId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_slug_key" ON "products"("storeId", "slug");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_sections" ADD CONSTRAINT "hero_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_sections" ADD CONSTRAINT "hero_sections_ctaTargetPageId_fkey" FOREIGN KEY ("ctaTargetPageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_sections" ADD CONSTRAINT "hero_sections_ctaTargetSectionId_fkey" FOREIGN KEY ("ctaTargetSectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories_sections" ADD CONSTRAINT "categories_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_grid_sections" ADD CONSTRAINT "product_grid_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_grid_sections" ADD CONSTRAINT "product_grid_sections_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rich_text_sections" ADD CONSTRAINT "rich_text_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_sections" ADD CONSTRAINT "contact_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cta_sections" ADD CONSTRAINT "cta_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cta_sections" ADD CONSTRAINT "cta_sections_buttonTargetPageId_fkey" FOREIGN KEY ("buttonTargetPageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cta_sections" ADD CONSTRAINT "cta_sections_buttonTargetSectionId_fkey" FOREIGN KEY ("buttonTargetSectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories_section_items" ADD CONSTRAINT "categories_section_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "categories_sections"("sectionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories_section_items" ADD CONSTRAINT "categories_section_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_grid_section_items" ADD CONSTRAINT "product_grid_section_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "product_grid_sections"("sectionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_grid_section_items" ADD CONSTRAINT "product_grid_section_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
