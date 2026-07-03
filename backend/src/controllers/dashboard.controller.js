const db = require("../config/database");

exports.getDashboard = (req, res) => {
    const userId = req.user.id;

    db.get("SELECT * FROM businesses WHERE user_id = ?", [userId], (err, business) => {
        if (err) return res.status(500).json({ message: "Database error.", error: err.message });
        if (!business) return res.status(404).json({ message: "Business not found." });

        const businessId = business.id;

        // Query 1: Overall business stats
        db.get(`
            SELECT
                COUNT(*) AS total_reviews,
                ROUND(AVG(business_rating), 1) AS avg_business_rating
            FROM reviews
            WHERE business_id = ?
        `, [businessId], (err, stats) => {
            if (err) return res.status(500).json({ message: "Database error.", error: err.message });

            // Query 2: Staff leaderboard
            db.all(`
                SELECT
                    s.id,
                    s.name,
                    s.position,
                    COUNT(r.id) AS total_reviews,
                    ROUND(AVG(r.staff_rating), 1) AS avg_staff_rating
                FROM staff s
                LEFT JOIN reviews r ON s.id = r.staff_id
                WHERE s.business_id = ? AND s.status = 'active'
                GROUP BY s.id
                ORDER BY avg_staff_rating DESC
            `, [businessId], (err, leaderboard) => {
                if (err) return res.status(500).json({ message: "Database error.", error: err.message });

                // Query 3: Recent reviews
                db.all(`
                    SELECT * FROM reviews
                    WHERE business_id = ?
                    ORDER BY created_at DESC
                    LIMIT 5
                `, [businessId], (err, recentReviews) => {
                    if (err) return res.status(500).json({ message: "Database error.", error: err.message });

                    res.status(200).json({
                        business: {
                            id: business.id,
                            business_name: business.business_name,
                            business_type: business.business_type,
                        },
                        stats: {
                            total_reviews: stats.total_reviews || 0,
                            avg_business_rating: stats.avg_business_rating || 0,
                        },
                        staff_leaderboard: leaderboard,
                        recent_reviews: recentReviews,
                    });
                });
            });
        });
    });
};

exports.getBusinessReviews = (req, res) => {
    const userId = req.user.id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    db.get("SELECT id FROM businesses WHERE user_id = ?", [userId], (err, business) => {
        if (err)      return res.status(500).json({ message: "Database error.", error: err.message });
        if (!business) return res.status(404).json({ message: "Business not found." });

        const businessId = business.id;

        db.get("SELECT COUNT(*) AS total FROM reviews WHERE business_id = ?", [businessId], (err, count) => {
            if (err) return res.status(500).json({ message: "Database error.", error: err.message });

            db.all(`
                SELECT
                    r.id, r.business_rating, r.business_comment,
                    r.staff_rating, r.staff_comment, r.created_at,
                    s.id AS staff_id, s.name AS staff_name, s.position AS staff_position
                FROM reviews r
                LEFT JOIN staff s ON r.staff_id = s.id
                WHERE r.business_id = ?
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            `, [businessId, limit, offset], (err, reviews) => {
                if (err) return res.status(500).json({ message: "Database error.", error: err.message });

                res.json({
                    total: count.total,
                    page,
                    limit,
                    total_pages: Math.ceil(count.total / limit),
                    reviews,
                });
            });
        });
    });
};

exports.getStaffReviews = (req, res) => {
    const userId  = req.user.id;
    const staffId = parseInt(req.params.staffId);
    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const limit   = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset  = (page - 1) * limit;

    // Verify the staff member belongs to this owner's business
    db.get(`
        SELECT s.id, s.name, s.position
        FROM staff s
        JOIN businesses b ON s.business_id = b.id
        WHERE s.id = ? AND b.user_id = ?
    `, [staffId, userId], (err, member) => {
        if (err)     return res.status(500).json({ message: "Database error.", error: err.message });
        if (!member) return res.status(404).json({ message: "Staff member not found." });

        db.get("SELECT COUNT(*) AS total FROM reviews WHERE staff_id = ?", [staffId], (err, count) => {
            if (err) return res.status(500).json({ message: "Database error.", error: err.message });

            db.all(`
                SELECT id, business_rating, business_comment, staff_rating, staff_comment, created_at
                FROM reviews
                WHERE staff_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [staffId, limit, offset], (err, reviews) => {
                if (err) return res.status(500).json({ message: "Database error.", error: err.message });

                res.json({
                    staff: member,
                    total: count.total,
                    page,
                    limit,
                    total_pages: Math.ceil(count.total / limit),
                    reviews,
                });
            });
        });
    });
};

module.exports = exports;