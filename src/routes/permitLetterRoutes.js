// src/routes/permitLetterRoutes.js
const express = require("express");
const { body, query } = require("express-validator");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const permitAuth = require("../middleware/permitLetter");
const ctrl = require("../controllers/permitLetterController");

const router = express.Router();
router.use(auth);

// 1) Create (upload)
router.post(
  "/permit-letters/upload",
  permitAuth,
  upload.single("dokumen"),
  [
    body("uraian").exists().withMessage("uraian is required"),
    body("no_surat").exists().withMessage("no_surat is required"),
    body("tanggal").isISO8601().withMessage("tanggal must be YYYY-MM-DD"),
    body("kategori_permit_letter")
      .exists()
      .withMessage("kategori_permit_letter is required"),
    body("sub_kategori_permit_letter")
      .exists()
      .withMessage("sub_kategori_permit_letter is required"),
    body("status_tahapan").exists().withMessage("status_tahapan is required"),
    body("nama_pt").exists().withMessage("nama_pt is required"),
  ],
  ctrl.postPermitLetter
);

// 2) Static lookup routes
router.get("/permit-letters", permitAuth, ctrl.getAllPermitLetters);
router.get(
  "/permit-letters/rejected",
  permitAuth,
  ctrl.getRejectedPermitLetter
);
router.get(
  "/permit-letters/approved",
  permitAuth,
  ctrl.getApprovedPermitLetter
);

router.get("/permit-letters/latest", permitAuth, ctrl.getLatestPermitLetter);
router.get(
  "/permit-letters/search",
  permitAuth,
  [query("term").optional().isString()],
  ctrl.searchPermitLetter
);
router.get("/permit-letters/pending", permitAuth, ctrl.getPendingPermitLetter);
router.get("/permit-letters/release", permitAuth, ctrl.getReleasePermitLetter);

// 3) Dynamic single‑item lookup (no regex)
router.get("/permit-letters/:id", permitAuth, ctrl.getPermitLetterById);

// 4) Update
router.put(
  "/permit-letters/edit/:id",
  permitAuth,
  upload.single("dokumen"),
  [
    body("uraian").optional().isString(),
    body("no_surat").optional().isString(),
    body("tanggal")
      .optional()
      .isISO8601()
      .withMessage("tanggal must be YYYY-MM-DD"),
    body("kategori_permit_letter").optional().isString(),
    body("sub_kategori_permit_letter").optional().isString(),
    body("status_tahapan").optional().isString(),
    body("nama_pt").optional().isString(),
    body("produk_no_surat_mabes").optional().isString(),
    body("note").optional().isString(),
    body("upload_status").optional().isString(),
  ],
  ctrl.updatePermitLetter
);

// 5) Delete
router.delete(
  "/permit-letters/delete/:id",
  permitAuth,
  ctrl.deletePermitLetter
);

module.exports = router;
