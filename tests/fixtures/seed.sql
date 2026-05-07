-- Synthetic seed for local dev (DO NOT mistake for real client data).
-- Apply after schema.sql:
--   wrangler d1 execute leonfindel --local --file=tests/fixtures/seed.sql

INSERT INTO media (
  code, source, source_id, source_url, type,
  title, client, project, location, year, description, tags,
  thumbnail_url, duration_sec, width, height, embed_url,
  created_at, indexed_at, vector_id
) VALUES
  (
    'B001', 'vimeo', '111111', 'https://vimeo.com/111111', 'video',
    'Spot Acme — lanzamiento Q1', 'Acme', 'Lanzamiento Q1 2024', 'Santiago', 2024,
    'Comercial de 30 segundos para campaña de lanzamiento.',
    '["comercial","auto","santiago"]',
    'https://i.vimeocdn.com/video/placeholder1.jpg',
    30, 1920, 1080, 'https://player.vimeo.com/video/111111',
    1704067200, 1735689600, 'B001'
  ),
  (
    'B002', 'vimeo', '222222', 'https://vimeo.com/222222', 'video',
    'Documental Patagonia', 'Fundación XYZ', 'Vida silvestre', 'Patagonia', 2023,
    'Documental sobre el huemul, ocho minutos, narrado en español.',
    '["documental","naturaleza","patagonia"]',
    'https://i.vimeocdn.com/video/placeholder2.jpg',
    480, 3840, 2160, 'https://player.vimeo.com/video/222222',
    1672531200, 1735689600, 'B002'
  ),
  (
    'F001', 'flickr', '333333', 'https://flickr.com/photos/leonfindel/333333', 'photo',
    'Retrato corporativo CEO Acme', 'Acme', 'Memoria Anual 2024', 'Santiago', 2024,
    'Retrato editorial blanco y negro.',
    '["retrato","corporativo"]',
    'https://live.staticflickr.com/placeholder/333333_z.jpg',
    NULL, 4032, 6048, NULL,
    1717200000, 1735689600, 'F001'
  ),
  (
    'F002', 'excel-only', NULL, NULL, 'photo',
    'Locación pendiente', 'Sin asignar', NULL, 'Valparaíso', 2022,
    'Foto del archivo, aún no subida a Flickr.',
    '["archivo"]',
    NULL, NULL, NULL, NULL, NULL,
    NULL, 1735689600, NULL
  );
