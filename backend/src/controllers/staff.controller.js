const db = require("../config/database");

const getBusinessIdForUser = (user_id, callback) => {
    db.get("SELECT id FROM businesses WHERE user_id = ?", [user_id], (err, business) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, business ? business.id : null);
    });
};

exports.addStaff = (req, res) => {
    const { name, position, photo } = req.body;
    const user_id = req.user.id;

    if (!name || !position) {
        return res.status(400).json({ message: "Name and position are required" });
    }

    getBusinessIdForUser(user_id, (err, business_id) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching business ID" });
        }
        if (!business_id) {
            return res.status(404).json({ message: "You must create a business before adding staff members" });
        }

        db.run("INSERT INTO staff (business_id, name, position, photo) VALUES (?, ?, ?, ?)", 
            [business_id, name, position, photo || null], 
            function(err) {
            if (err) {
                return res.status(500).json({ message: "Could not add staff member" });
            }
            res.status(201).json({ message: "Staff member added successfully", id: this.lastID });
        });
    });
};

exports.getAllStaff = (req, res) => {
    const user_id = req.user.id;

    getBusinessIdForUser(user_id, (err, business_id) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching business ID" });
        }
        if (!business_id) {
            return res.status(404).json({ message: "No business found for this user" });
        }

        db.all("SELECT * FROM staff WHERE business_id = ? ORDER BY created_at DESC", 
            [business_id], 
            (err, staff) => {
            if (err) {
                return res.status(500).json({ message: "Could not retrieve staff members" });
            }
            res.status(200).json({ staff });
        });
    });
};

exports.getStaff = (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    getBusinessIdForUser(user_id, (err, business_id) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching business ID" });
        }
        if (!business_id) {
            return res.status(404).json({ message: "No business found for this user" });
        }

        db.get("SELECT * FROM staff WHERE id = ? AND business_id = ?",
            [id, business_id], (err, member) => {
            if (err) {
                return res.status(500).json({ message: "Could not retrieve staff member" });
            }
            if (!member) {
                return res.status(404).json({ message: "Staff member not found" });
            }
            res.status(200).json({ staff: member });
        });
    });
};

exports.updateStaff = (req, res) => {
    const { id } = req.params;
    const { name, position, photo, status } = req.body;
    const user_id = req.user.id;

    getBusinessIdForUser(user_id, (err, business_id) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching business ID" });
        }
        if (!business_id) {
            return res.status(404).json({ message: "No business found for this user" });
        }

        db.get("SELECT * FROM staff WHERE id = ? AND business_id = ?", 
            [id, business_id], (err, member) => {
            if (err) {
                return res.status(500).json({ message: "Could not retrieve staff member" });
            }
            if (!member) {
                return res.status(404).json({ message: "Staff member not found or access denied" });
            }

            db.run(`UPDATE staff 
                SET name = COALESCE(?, name), 
                    position = COALESCE(?, position), 
                    photo = COALESCE(?, photo),
                    status = COALESCE(?, status) 
                WHERE id = ?`, 
                [name, position, photo, status, id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: "Could not update staff member" });
                    }
                    res.status(200).json({ message: "Staff member updated successfully" });
                });
        });
    });
};

exports.deleteStaff = (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    getBusinessIdForUser(user_id, (err, business_id) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching business ID" });
        }
        if (!business_id) {
            return res.status(404).json({ message: "No business found for this user" });
        }
        db.run("DELETE FROM staff WHERE id = ? AND business_id = ?", [id, business_id], function(err) {
            if (err) {
                return res.status(500).json({ message: "Could not delete staff member" });
            }
            res.status(200).json({ message: "Staff member deleted successfully" });
        });
    });
};

module.exports = exports;