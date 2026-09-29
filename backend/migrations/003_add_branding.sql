-- 003_add_branding.sql — banner image, profile image, short bio for the
-- public booking page. All nullable: a business with none of these set
-- just renders without them.

ALTER TABLE businesses ADD COLUMN banner_url TEXT;
ALTER TABLE businesses ADD COLUMN profile_image_url TEXT;
ALTER TABLE businesses ADD COLUMN bio TEXT;