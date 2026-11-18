-- Structured project execution date and status.
-- Existing period text and CMS publication status are deliberately preserved.
ALTER TABLE projects ADD COLUMN month INTEGER CHECK (month BETWEEN 1 AND 12);
ALTER TABLE projects ADD COLUMN year INTEGER CHECK (year BETWEEN 1900 AND 2200);
ALTER TABLE projects ADD COLUMN execution_status TEXT
  CHECK (execution_status IN ('Completed', 'In Progress'));

CREATE INDEX IF NOT EXISTS projects_chronology_idx
  ON projects(status, deleted_at, year DESC, month DESC, id DESC);
