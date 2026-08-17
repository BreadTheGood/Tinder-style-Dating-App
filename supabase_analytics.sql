CREATE SCHEMA IF NOT EXISTS analytics;

DROP VIEW IF EXISTS analytics.top_receivers;
DROP VIEW IF EXISTS analytics.top_spenders;
DROP VIEW IF EXISTS analytics.top_drinks;
DROP VIEW IF EXISTS analytics.event_summary;

CREATE OR REPLACE VIEW analytics.event_summary AS
SELECT 
    e.id AS event_id,
    e.name,
    e.status,
    e.manager_id,
    (SELECT COUNT(DISTINCT profile_id) FROM public."ProfileEvents" WHERE event_id = e.id) AS total_attendees,
    (SELECT COUNT(*) FROM public."Transactions" WHERE event_id = e.id AND status = 'approved') AS total_transactions,
    COALESCE((SELECT SUM(quantity) FROM public."Transactions" WHERE event_id = e.id AND status = 'approved'), 0) AS total_drinks_sold,
    COALESCE((SELECT SUM(total_amount) FROM public."Transactions" WHERE event_id = e.id AND status = 'approved'), 0) AS total_revenue
FROM public."Events" e;

CREATE OR REPLACE VIEW analytics.top_spenders AS
SELECT 
    t.event_id,
    e.name AS event_name,
    e.manager_id,
    p.id AS profile_id,
    p.name AS user_name,
    SUM(t.quantity) AS total_drinks_bought,
    SUM(t.total_amount) AS total_spent,
    COUNT(t.id) AS purchase_count
FROM public."Transactions" t
JOIN public."Profiles" p ON t.sender_id = p.id
JOIN public."Events" e ON t.event_id = e.id
WHERE t.status = 'approved'
GROUP BY t.event_id, e.name, e.manager_id, p.id, p.name
ORDER BY total_spent DESC;

CREATE OR REPLACE VIEW analytics.top_receivers AS
SELECT 
    t.event_id,
    e.name AS event_name,
    e.manager_id,
    p.id AS profile_id,
    p.name AS user_name,
    SUM(t.quantity) AS total_drinks_received
FROM public."Transactions" t
JOIN public."Profiles" p ON t.receiver_id = p.id
JOIN public."Events" e ON t.event_id = e.id
WHERE t.status = 'approved'
GROUP BY t.event_id, e.name, e.manager_id, p.id, p.name
ORDER BY total_drinks_received DESC;

CREATE OR REPLACE VIEW analytics.top_drinks AS
SELECT 
    t.event_id,
    e.manager_id,
    d.id AS drink_id,
    d.name AS drink_name,
    d.icon AS drink_icon,
    SUM(t.quantity) AS total_sold
FROM public."Transactions" t
JOIN public."Drinks" d ON t.drink_id = d.id
JOIN public."Events" e ON t.event_id = e.id
WHERE t.status = 'approved'
GROUP BY t.event_id, e.manager_id, d.id, d.name, d.icon
ORDER BY total_sold DESC;

CREATE OR REPLACE FUNCTION get_event_analytics(p_event_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role text;
    v_summary json;
    v_spenders json;
    v_receivers json;
    v_drinks json;
BEGIN
    SELECT role INTO v_role FROM public."Managers" WHERE id = auth.uid() AND is_active = true;
    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado: No eres manager activo.';
    END IF;

    IF v_role != 'system_admin' THEN
        IF NOT EXISTS (SELECT 1 FROM public."Events" WHERE id = p_event_id AND manager_id = auth.uid()) THEN
            RAISE EXCEPTION 'Acceso denegado: No gestionas este evento.';
        END IF;
    END IF;

    SELECT row_to_json(s) INTO v_summary FROM analytics.event_summary s WHERE s.event_id = p_event_id;

    SELECT json_agg(row_to_json(ts)) INTO v_spenders 
    FROM (SELECT * FROM analytics.top_spenders WHERE event_id = p_event_id LIMIT 10) ts;

    SELECT json_agg(row_to_json(tr)) INTO v_receivers 
    FROM (SELECT * FROM analytics.top_receivers WHERE event_id = p_event_id LIMIT 10) tr;

    SELECT json_agg(row_to_json(td)) INTO v_drinks 
    FROM (SELECT * FROM analytics.top_drinks WHERE event_id = p_event_id LIMIT 10) td;

    RETURN json_build_object(
        'summary', v_summary,
        'top_spenders', COALESCE(v_spenders, '[]'::json),
        'top_receivers', COALESCE(v_receivers, '[]'::json),
        'top_drinks', COALESCE(v_drinks, '[]'::json)
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_general_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role text;
    v_summary json;
    v_spenders json;
    v_receivers json;
    v_drinks json;
BEGIN
    SELECT role INTO v_role FROM public."Managers" WHERE id = auth.uid() AND is_active = true;
    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Acceso denegado: No eres manager activo.';
    END IF;

    IF v_role = 'system_admin' THEN
        SELECT row_to_json(t) INTO v_summary FROM (
            SELECT 
                SUM(total_attendees) as total_attendees,
                SUM(total_transactions) as total_transactions,
                SUM(total_drinks_sold) as total_drinks_sold,
                SUM(total_revenue) as total_revenue
            FROM analytics.event_summary
        ) t;

        SELECT json_agg(row_to_json(ts)) INTO v_spenders 
        FROM (
            SELECT profile_id, user_name, SUM(total_drinks_bought) as total_drinks_bought, SUM(total_spent) as total_spent, SUM(purchase_count) as purchase_count
            FROM analytics.top_spenders 
            GROUP BY profile_id, user_name 
            ORDER BY SUM(total_spent) DESC 
            LIMIT 10
        ) ts;

        SELECT json_agg(row_to_json(tr)) INTO v_receivers 
        FROM (
            SELECT profile_id, user_name, SUM(total_drinks_received) as total_drinks_received
            FROM analytics.top_receivers 
            GROUP BY profile_id, user_name 
            ORDER BY SUM(total_drinks_received) DESC 
            LIMIT 10
        ) tr;

        SELECT json_agg(row_to_json(td)) INTO v_drinks 
        FROM (
            SELECT drink_name, drink_icon, SUM(total_sold) as total_sold
            FROM analytics.top_drinks 
            GROUP BY drink_name, drink_icon 
            ORDER BY SUM(total_sold) DESC 
            LIMIT 10
        ) td;
    ELSE
        SELECT row_to_json(t) INTO v_summary FROM (
            SELECT 
                SUM(total_attendees) as total_attendees,
                SUM(total_transactions) as total_transactions,
                SUM(total_drinks_sold) as total_drinks_sold,
                SUM(total_revenue) as total_revenue
            FROM analytics.event_summary
            WHERE manager_id = auth.uid()
        ) t;

        SELECT json_agg(row_to_json(ts)) INTO v_spenders 
        FROM (
            SELECT profile_id, user_name, SUM(total_drinks_bought) as total_drinks_bought, SUM(total_spent) as total_spent, SUM(purchase_count) as purchase_count
            FROM analytics.top_spenders 
            WHERE manager_id = auth.uid()
            GROUP BY profile_id, user_name 
            ORDER BY SUM(total_spent) DESC 
            LIMIT 10
        ) ts;

        SELECT json_agg(row_to_json(tr)) INTO v_receivers 
        FROM (
            SELECT profile_id, user_name, SUM(total_drinks_received) as total_drinks_received
            FROM analytics.top_receivers 
            WHERE manager_id = auth.uid()
            GROUP BY profile_id, user_name 
            ORDER BY SUM(total_drinks_received) DESC 
            LIMIT 10
        ) tr;

        SELECT json_agg(row_to_json(td)) INTO v_drinks 
        FROM (
            SELECT drink_name, drink_icon, SUM(total_sold) as total_sold
            FROM analytics.top_drinks 
            WHERE manager_id = auth.uid()
            GROUP BY drink_name, drink_icon 
            ORDER BY SUM(total_sold) DESC 
            LIMIT 10
        ) td;
    END IF;

    RETURN json_build_object(
        'summary', v_summary,
        'top_spenders', COALESCE(v_spenders, '[]'::json),
        'top_receivers', COALESCE(v_receivers, '[]'::json),
        'top_drinks', COALESCE(v_drinks, '[]'::json)
    );
END;
$$;

