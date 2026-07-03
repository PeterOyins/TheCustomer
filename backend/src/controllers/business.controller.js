const db = require("../config/database");
const QRCode = require("qrcode");

exports.createBusiness = (req, res) => {
   const { business_name, business_type, phone, address, logo } = req.body;
   const user_id = req.user.id;

   if (!business_name || !business_type || !phone || !address) {
    return res.status(400).json({ message: "business_name, business_type, phone, and address are required" });
    }

    db.get("SELECT * FROM businesses WHERE user_id = ?", [user_id], (err, existing) => {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        if (existing) return res.status(400).json({ message: "You already have a registered business." });

    db.run(
        "INSERT INTO businesses (user_id, business_name, business_type, phone, address, logo) VALUES (?, ?, ?, ?, ?, ?)",
        [user_id, business_name, business_type, phone, address, logo],
        function (err) {
            if (err) return res.status(500).json({ message: "Could not create business", error: err.message });

            const businessId = this.lastID;
            const feedbackUrl = `${process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`}/feedback/${businessId}`;

            QRCode.toDataURL(feedbackUrl, (err, qrCodeDataUrl) => {
                if (err) return res.status(201).json({ message: "Business created, but QR code generation failed", businessId, error: err.message });

                db.run(
                    "UPDATE businesses SET qr_code = ? WHERE id = ?",
                    [qrCodeDataUrl, businessId],
                    function (err) {
                        if (err) return res.status(201).json({ message: "Business created, but QR code could not be saved", businessId, error: err.message });

                        res.status(201).json({ message: "Business created successfully", 
                            businessId, 
                            qr_code: qrCodeDataUrl,
                            feedbackUrl
                        });
                    }
                );
            });
        }
    );
    });
};

exports.getBusiness = (req, res) => {
    const user_id = req.user.id;

    db.get("SELECT * FROM businesses WHERE user_id = ?", [user_id], (err, business) => {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        if (!business) return res.status(404).json({ message: "No business found for this user." });

        res.status(200).json({ business });
    });
};

exports.updateBusiness = (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    const { business_name, business_type, phone, address, logo } = req.body;

    db.get("SELECT * FROM businesses WHERE id = ? AND user_id = ?", [id, user_id], (err, business) => {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        if (!business) return res.status(404).json({ message: "Business not found or you do not have permission to update it." });

        db.run(
            `UPDATE businesses 
            SET business_name = COALESCE(?, business_name), 
            business_type = COALESCE(?, business_type), 
            phone = COALESCE(?, phone), 
            address = COALESCE(?, address), 
            logo = COALESCE(?, logo) 
            WHERE id = ?`,
            [business_name, business_type, phone, address, logo, id],
            function (err) {
                if (err) return res.status(500).json({ message: "Could not update business", error: err.message });
                res.status(200).json({ message: "Business updated successfully" });
            }
        );
    });
};

exports.deleteBusiness = (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    db.get("SELECT * FROM businesses WHERE id = ? AND user_id = ?", [id, user_id], (err, business) => {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        if (!business) return res.status(404).json({ message: "Business not found or you do not have permission to delete it." });

        db.run("DELETE FROM businesses WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ message: "Could not delete business", error: err.message });
            res.status(200).json({ message: "Business deleted successfully" });
        });
    });
};