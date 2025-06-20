// src/controllers/permitLetterController.js
const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { encrypt, decrypt } = require("../services/encryptionService");
const DateParser = require("../utils/dateParser"); // your equivalent
const { sendNotification } = require("../services/notificationService");
const PermitLetter = require("../models/PermitLetter");
const User = require("../models/User");

function handleValidation(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    res.status(400).json({
      status: 'error',
      errors: errs.array().map(e => e.msg)
    });
    return false;   // invalid → stop processing
  }
  return true;      // valid → continue
}

function buildUrl(relPath) {
  const full = path.join(__dirname, "../../public", relPath);
  return fs.existsSync(full) ? `${process.env.APP_URL}/${relPath}` : null;
}

// POST /api/permit-letters/upload
exports.postPermitLetter = async (req, res) => {
  if (handleValidation(req, res)) return;
  const data = req.body;

  // 1) Unique no_surat
  if (await PermitLetter.findOne({ where: { no_surat: data.no_surat } })) {
    return res.status(400).json({
      status: "error",
      message: "The no surat already exists.",
    });
  }

  // 2) Default upload_status & parse date
  data.upload_status = "PENDING";
  data.user_id = req.user.id;
  const parsed = DateParser.parseDate(data.tanggal);
  if (!parsed) {
    return res.status(400).json({
      status: "error",
      message: "Invalid tanggal format.",
    });
  }
  data.tanggal = parsed;

  // 3) Handle file
  if (req.file) {
    const filename = `${Date.now()}_${req.file.originalname}`;
    const dest = path.join(__dirname, "../../public/permit_letters");
    if (!fs.existsSync(dest))
      fs.mkdirSync(dest, { recursive: true, mode: 0o755 });
    // Multer already saved temp file at req.file.path; move it:
    fs.renameSync(req.file.path, path.join(dest, filename));
    data.dokumen = `permit_letters/${filename}`;
  }

  // 4) Create record
  const pl = await PermitLetter.create(data);

  // 5) Notify user & admins
  await createAndSend({
    notifiableType: "User",
    notifiableId: req.user.id,
    type: "user_permit_letter",
    data: {
      permit_letter_id: pl.id,
      message: "Your permit letter has been uploaded and is awaiting review.",
    },
    fcmNotif: {
      title: "Permit Letter Uploaded",
      body: "Your permit letter has been uploaded and is awaiting review.",
    },
  });

  const admins = await User.findAll({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await createAndSend({
      notifiableType: "User",
      notifiableId: admin.id,
      type: "admin_permit_letter",
      data: { permit_letter_id: pl.id },
      fcmNotif: {
        title: "Permit Letter Submitted",
        body: `${req.user.username} from ${req.user.division} has submitted a permit letter and is awaiting your review.`,
      },
    });
  }

  // 6) Decrypt for response
  const url = pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null;
  return res.status(201).json({
    status: "success",
    message: "Permit Letter created successfully.",
    data: {
      ...pl.toJSON(),
      dokumenUrl: url,
    },
  });
};

// GET /api/permit-letters/:id
exports.getPermitLetterById = async (req, res) => {
  if (handleValidation(req, res)) return;
  const pl = await PermitLetter.findByPk(req.params.id);
  if (!pl) {
    return res
      .status(404)
      .json({ status: "error", message: "Permit Letter not found." });
  }
  const url = pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null;
  return res.json({
    status: "success",
    message: "Permit Letter retrieved successfully.",
    data: {
      ...pl.toJSON(),
      dokumenUrl: url,
    },
  });
};

// GET /api/permit-letters/latest
exports.getLatestPermitLetter = async (_req, res) => {
  const pl = await PermitLetter.findOne({ order: [["created_at", "DESC"]] });
  if (!pl) {
    return res.status(404).json({
      status: "error",
      message: "Permit Letter not found.",
      data: [],
    });
  }
  const url = pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null;
  return res.json({
    status: "success",
    message: "Permit Letter retrieved successfully.",
    data: [{ ...pl.toJSON(), dokumenUrl: url }],
  });
};

// GET /api/permit-letters
exports.getAllPermitLetters = async (req, res) => {
  if (!["ADMIN", "USER"].includes(req.user.role)) {
    return res.status(403).json({ status: "error", message: "Unauthorized." });
  }
  const list = await PermitLetter.findAll();
  const data = list.map((pl) => {
    const url = pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null;
    return { ...pl.toJSON(), dokumenUrl: url };
  });
  return res.json({
    status: "success",
    message: "Permit letters retrieved successfully.",
    data,
  });
};

// GET /api/permit-letters/search
exports.searchPermitLetter = async (req, res) => {
  if (handleValidation(req, res)) return;
  const where = {};
  for (let key of [
    "uraian",
    "no_surat",
    "nama_pt",
    "kategori_permit_letter",
    "produk_no_surat_mabes",
    "upload_status",
    "sub_kategori_permit_letter",
  ]) {
    if (req.query[key]) {
      where[key] = { [Op.like]: `%${req.query[key]}%` };
    }
  }
  if (req.query.tanggal) {
    where.tanggal = { [Op.like]: `%${req.query.tanggal}%` };
  }
  const page = +req.query.page || 1;
  const perPage = +req.query.perPage || 10;
  const { count, rows } = await PermitLetter.findAndCountAll({
    where,
    offset: (page - 1) * perPage,
    limit: perPage,
    order: [["created_at", "DESC"]],
  });
  if (!rows.length) {
    return res
      .status(404)
      .json({ status: "error", message: "No Permit Letters found." });
  }
  const data = rows.map((pl) => ({
    ...pl.toJSON(),
    dokumenUrl: pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null,
  }));
  return res.json({
    status: "success",
    message: "Permit letters retrieved successfully.",
    meta: { total: count, page, perPage },
    data,
  });
};

// PUT /api/permit-letters/edit/:id
exports.updatePermitLetter = async (req, res) => {
  if (!handleValidation(req, res)) return;

  const pl = await PermitLetter.findByPk(req.params.id);
  if (!pl) {
    return res.status(400).json({
      status: "error",
      message: "Permit Letter not found.",
    });
  }

  // 1) Whitelisted fields
  const allowed = [
    "uraian",
    "nama_pt",
    "tanggal",
    "no_surat",
    "status_tahapan",
    "kategori_permit_letter",
    "produk_no_surat_mabes",
    "sub_kategori_permit_letter",
    "note",
    "upload_status",
  ];
  const data = {};
  for (let key of allowed) {
    if (req.body[key] !== undefined) {
      data[key] = req.body[key];
    }
  }

  // 2) Parse tanggal
  if (data.tanggal) {
    const pd = parseDate(data.tanggal);
    if (!pd) {
      return res.status(400).json({
        status: "error",
        message: "The tanggal format is invalid. Please use dd-mm-yyyy.",
      });
    }
    data.tanggal = pd;
  }

  // 3) Handle file
  if (req.file) {
    const filename = req.file.filename;
    // Decide destination and DB field
    const isAdmin = req.user.role === "ADMIN";
    const isReleasePhase = data.status_tahapan === "Release";
    if (isAdmin && isReleasePhase) {
      // move to permit_letters_released
      const dest = path.join(__dirname, "../../public/permit_letters_released");
      if (!fs.existsSync(dest))
        fs.mkdirSync(dest, { recursive: true, mode: 0o755 });
      fs.renameSync(req.file.path, path.join(dest, filename));
      data.released_dokumen = encrypt(`permit_letters_released/${filename}`);
    } else {
      // move to permit_letters
      const dest = path.join(__dirname, "../../public/permit_letters");
      if (!fs.existsSync(dest))
        fs.mkdirSync(dest, { recursive: true, mode: 0o755 });
      fs.renameSync(req.file.path, path.join(dest, filename));
      data.dokumen = encrypt(`permit_letters/${filename}`);
    }
  }

  // 4) Apply update
  await pl.update(data);

  // 5) Build notification message
  let message;
  if (data.upload_status) {
    switch (data.upload_status) {
      case "APPROVED":
        message = "Upload Status is APPROVED.";
        break;
      case "REJECTED":
        message =
          "Upload Status is REJECTED. Please review the notes for more details.";
        break;
      default:
        message = `Your permit letter status has been updated to: ${data.upload_status}`;
    }
  } else if (data.note) {
    message =
      "Your permit letter has been updated. Please review the notes for more details.";
  } else if (data.status_tahapan) {
    switch (data.status_tahapan) {
      case "Draft":
      case "Verifikasi 3":
      case "Approval":
        message = `Your permit letter status has been updated to ${data.status_tahapan}`;
        break;
      case "Release":
        message = `Your permit letter is ${data.status_tahapan}, you might want to check it`;
        break;
      default:
        message = "Your permit letter status has been updated.";
    }
  }

  // 6) Send notification if needed
  if (message) {
    await createAndSend({
      notifiableType: "User",
      notifiableId: pl.user_id,
      type: "user_permit_letter",
      data: { permit_letter_id: pl.id, message },
      fcmNotif: { title: "Permit Letter Update", body: message },
    });
  }

  // 7) Build URLs
  const dokRel = pl.dokumen ? decrypt(pl.dokumen) : null;
  const relDokRel = pl.released_dokumen ? decrypt(pl.released_dokumen) : null;
  const dokUrl = dokRel ? buildUrl(dokRel) : null;
  const relDokUrl = relDokRel ? buildUrl(relDokRel) : null;

  // 8) Return resource shape
  return res.json({
    status: "success",
    data: {
      ...pl.toJSON(),
      dokumen_url: dokUrl,
      released_dokumen_url: relDokUrl,
    },
  });
};

// DELETE /api/permit-letters/delete/:id
exports.deletePermitLetter = async (req, res) => {
  if (handleValidation(req, res)) return;
  const pl = await PermitLetter.findByPk(req.params.id);
  if (!pl) {
    return res
      .status(400)
      .json({ status: "error", message: "Permit Letter not found." });
  }
  // delete file
  const old = pl.dokumen ? decrypt(pl.dokumen) : null;
  if (old) fs.unlinkSync(path.join(__dirname, "../../public", old));
  await pl.destroy();
  return res.json({
    status: "success",
    message: "Permit Letter deleted successfully.",
  });
};

// GET /api/permit-letters/approved
exports.getApprovedPermitLetter = async (_req, res) => {
  const list = await PermitLetter.findAll({
    where: { upload_status: "APPROVED" },
  });
  if (!list.length) {
    return res
      .status(404)
      .json({ status: "error", message: "No approved Permit Letters found." });
  }
  const data = list.map((pl) => ({
    ...pl.toJSON(),
    dokumenUrl: pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null,
  }));
  return res.json({
    status: "success",
    message: "Approved Permit Letters retrieved successfully.",
    data,
  });
};

// GET /api/permit-letters/rejected
exports.getRejectedPermitLetter = async (_req, res) => {
  const list = await PermitLetter.findAll({
    where: { upload_status: "REJECTED" },
  });
  if (!list.length) {
    return res
      .status(404)
      .json({ status: "error", message: "No rejected Permit Letters found." });
  }
  const data = list.map((pl) => ({
    ...pl.toJSON(),
    dokumenUrl: pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null,
  }));
  return res.json({
    status: "success",
    message: "Rejected Permit Letters retrieved successfully.",
    data,
  });
};

// GET /api/permit-letters/pending
exports.getPendingPermitLetter = async (_req, res) => {
  const list = await PermitLetter.findAll({
    where: { upload_status: "PENDING" },
  });
  if (!list.length) {
    return res
      .status(404)
      .json({ status: "error", message: "No pending Permit Letters found." });
  }
  const data = list.map((pl) => ({
    ...pl.toJSON(),
    dokumenUrl: pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null,
  }));
  return res.json({
    status: "success",
    message: "Pending Permit Letters retrieved successfully.",
    data,
  });
};

// GET /api/permit-letters/release
exports.getReleasePermitLetter = async (_req, res) => {
  const list = await PermitLetter.findAll({
    where: { status_tahapan: "Release" },
  });
  if (!list.length) {
    return res
      .status(404)
      .json({ status: "error", message: "No released Permit Letters found." });
  }
  const data = list.map((pl) => ({
    ...pl.toJSON(),
    dokumenUrl: pl.dokumen ? buildUrl(decrypt(pl.dokumen)) : null,
  }));
  return res.json({
    status: "success",
    message: "Released Permit Letters retrieved successfully.",
    data,
  });
};
