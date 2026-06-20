-- =========================================================================
-- LEAD HISTORY AND TRACKING EXTENSION
-- =========================================================================

-- 1. Create Lead Status History Table
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(50) NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
    order_id VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255),
    changed_by_role VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for timeline queries
CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_order_id ON public.lead_status_history(order_id);

-- Enable RLS
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_status_history_select ON public.lead_status_history FOR SELECT USING (TRUE);
CREATE POLICY lead_status_history_insert ON public.lead_status_history FOR INSERT WITH CHECK (TRUE);


-- 2. Staff Assignment History Table
CREATE TABLE IF NOT EXISTS public.lead_staff_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(50) NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
    order_id VARCHAR(50),
    assigned_role VARCHAR(100) NOT NULL,
    assigned_staff VARCHAR(255) NOT NULL,
    assigned_by VARCHAR(255),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_staff_assignment_lead_id ON public.lead_staff_assignment_history(lead_id);

-- Enable RLS
ALTER TABLE public.lead_staff_assignment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_staff_assignment_select ON public.lead_staff_assignment_history FOR SELECT USING (TRUE);
CREATE POLICY lead_staff_assignment_insert ON public.lead_staff_assignment_history FOR INSERT WITH CHECK (TRUE);


-- 3. Equipment History Table
CREATE TABLE IF NOT EXISTS public.lead_equipment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(50) NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
    order_id VARCHAR(50),
    equipment_name VARCHAR(255) NOT NULL,
    equipment_status VARCHAR(50) NOT NULL,
    returned_by VARCHAR(255),
    returned_at TIMESTAMPTZ,
    remarks TEXT
);

CREATE INDEX idx_lead_equipment_history_lead_id ON public.lead_equipment_history(lead_id);

-- Enable RLS
ALTER TABLE public.lead_equipment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_equipment_history_select ON public.lead_equipment_history FOR SELECT USING (TRUE);
CREATE POLICY lead_equipment_history_insert ON public.lead_equipment_history FOR INSERT WITH CHECK (TRUE);


-- 4. Production Editor Assignment History Table
CREATE TABLE IF NOT EXISTS public.lead_editor_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(50) NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
    order_id VARCHAR(50),
    production_role VARCHAR(100) NOT NULL,
    editor_name VARCHAR(255) NOT NULL,
    assigned_by VARCHAR(255),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_editor_assignment_lead_id ON public.lead_editor_assignment_history(lead_id);

-- Enable RLS
ALTER TABLE public.lead_editor_assignment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_editor_assignment_select ON public.lead_editor_assignment_history FOR SELECT USING (TRUE);
CREATE POLICY lead_editor_assignment_insert ON public.lead_editor_assignment_history FOR INSERT WITH CHECK (TRUE);


-- 5. Trigger Function for Auto-Logging Lead Status
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status VARCHAR(50);
    v_new_status VARCHAR(50);
    v_order_id VARCHAR(50);
    v_changed_by VARCHAR(255);
    v_remarks TEXT;
BEGIN
    -- Determine which status changed: prioritizing current_status, fallback to status
    IF TG_OP = 'UPDATE' THEN
        IF NEW.current_status IS DISTINCT FROM OLD.current_status THEN
            v_old_status := OLD.current_status;
            v_new_status := NEW.current_status;
        ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
            v_old_status := OLD.status;
            v_new_status := NEW.status;
        ELSE
            -- No relevant status change to track
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_status := NULL;
        v_new_status := COALESCE(NEW.current_status, NEW.status);
    END IF;

    -- Fetch order ID if exists
    SELECT order_id INTO v_order_id FROM public.orders WHERE lead_id = NEW.lead_id LIMIT 1;
    
    v_changed_by := COALESCE(NEW.updated_by, NEW.created_by, 'System');
    v_remarks := NEW.remarks;

    INSERT INTO public.lead_status_history (
        lead_id, order_id, old_status, new_status, changed_by, remarks
    ) VALUES (
        NEW.lead_id, v_order_id, v_old_status, v_new_status, v_changed_by, v_remarks
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger on leads table
DROP TRIGGER IF EXISTS trigger_log_lead_status ON public.leads;

CREATE TRIGGER trigger_log_lead_status
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION log_lead_status_change();

-- 7. Turn on Realtime for these new tables
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_status_history;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_staff_assignment_history;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_equipment_history;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_editor_assignment_history;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Realtime publication might not exist locally, ignoring
END $$;
