const db = require("../config/database");

exports.getPublicStaff = (req, res) => {
    const { businessId } = req.params;

    db.get("SELECT * FROM businesses WHERE id = ?", [businessId], (err, business) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err.message });
        }
        if (!business) {
            return res.status(404).json({ message: "Business not found" });
        }

        db.all(
            "SELECT id, name, position FROM staff WHERE business_id = ? AND status = 'active'", [businessId], (err, staff) => {
            if (err) {
                return res.status(500).json({ message: "Database error", error: err.message });
            }
            res.json({
                business: { id: business.id, business_name: business.business_name, business_type: business.business_type },
                staff
            });
        });
    });
};

exports.submitReview = (req, res) => {
    const { businessId } = req.params;
    const { business_rating, business_comment, staff_id, staff_rating, staff_comment } = req.body;

    //Business rating is always required, staff rating is optional
    if (!business_rating) {
        return res.status(400).json({ message: "Business rating is required" });
    }

    const parsedBusinessRating = parseInt(business_rating, 10);
    if (isNaN(parsedBusinessRating) || parsedBusinessRating < 1 || parsedBusinessRating > 5) {
        return res.status(400).json({ message: "Business rating must be between 1 and 5" });
    }

    //Validate staff rating if provided
    let parsedStaffRating = null;
    if (staff_rating !== undefined && staff_rating !== null && staff_rating !== '') {
        parsedStaffRating = parseInt(staff_rating, 10);
        if (isNaN(parsedStaffRating) || parsedStaffRating < 1 || parsedStaffRating > 5) {
            return res.status(400).json({ message: "Staff rating must be between 1 and 5" });
        }
    }

    // Verify is the business exists
    db.get("SELECT * FROM businesses WHERE id = ?", [businessId], (err, business) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err.message });
        }
        if (!business) {
            return res.status(404).json({ message: "Business not found" });
        }

        // If a staff member is chosen, verify that the staff member exists and belongs to the business
        if (staff_id) {
            db.get("SELECT * FROM staff WHERE id = ? AND business_id = ? AND status = 'active'", 
                [staff_id, businessId], 
                (err, member) => {
                if (err) {
                    return res.status(500).json({ message: "Database error", error: err.message });
                }
                if (!member) {
                    return res.status(404).json({ message: "Staff member not found" });
                }

                insertReview();
            });
        } else {
            //No staff member selected, proceed with review submission
            insertReview();
        }
        });


        function insertReview() {
            db.run(
                `INSERT INTO reviews (business_id, business_rating, business_comment, staff_id, staff_rating, staff_comment) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    businessId, 
                    parsedBusinessRating, 
                    business_comment || null, 
                    staff_id || null, 
                    parsedStaffRating, 
                    staff_comment || null
                ],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: "Database error, Could not submit review", error: err.message });
                    }
                    res.status(201).json({ message: "Review submitted successfully.", reviewId: this.lastID });
                }
            );
        }
        };

module.exports = exports;