import crypto from "crypto";
import User from "../models/User.js";
import { sendMail } from "../config/sendMailDb.js";

import Class from "../models/Class.js";
import Assignment from "../models/Assignment.js";
import Attempt from "../models/Attempt.js";
import PracticeSession from "../models/PracticeSession.js";

// POST /api/teachers  (admin only)
export const createTeacher = async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const emailOrPhone = req.body.emailOrPhone?.trim().toLowerCase();

    if (!fullName || !emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "fullName, emailOrPhone and password are required",
        data: {},
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
        data: {},
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
        data: {},
      });
    }

    if (await User.findOne({ emailOrPhone })) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
        data: {},
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const teacher = await User.create({
      fullName,
      emailOrPhone,
      password,
      role: "teacher", // hard-coded, never taken from req.body
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    const link = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    let emailSent = true;
    try {
      await sendMail({
        to: teacher.emailOrPhone,
        subject: "Your ExamPrep NG teacher account",
        html: `<h2>Hello ${teacher.fullName},</h2>
               <p>An admin created a teacher account for you. Verify your email:</p>
               <p><a href="${link}">${link}</a></p>`,
      });
    } catch (e) {
      emailSent = false;
      console.error("TEACHER EMAIL ERROR:", e);
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Teacher account created. A verification email has been sent."
        : "Teacher account created, but the verification email failed. Use resend-verification.",
      data: {
        teacher: {
          id: teacher._id,
          fullName: teacher.fullName,
          emailOrPhone: teacher.emailOrPhone,
          role: teacher.role,
        },
      },
    });
  } catch (error) {
    console.error("CREATE TEACHER ERROR:", error);
    return res.status(500).json({ success: false, message: error.message, data: {} });
  }
};

// GET /api/teachers/dashboard
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id || req.user.id;

    // Get this teacher's classes and their students.
    const classes = await Class.find({ teacher: teacherId })
      .populate("subjects", "name")
      .populate("students", "fullName")
      .lean();

    const classIds = classes.map((item) => item._id);

    // Count each student only once across the teacher's classes.
    const studentMap = new Map();

    for (const item of classes) {
      for (const student of item.students || []) {
        studentMap.set(student._id.toString(), student);
      }
    }

    const studentIds = [...studentMap.keys()];

    // Only retrieve assignments belonging to this teacher.
    const assignments = await Assignment.find({
      teacher: teacherId,
    })
      .populate("subject", "name")
      .populate("class", "name")
      .select("title subject class postDate dueDate status questions")
      .lean();

    // A student is considered active if they have an attempt
    // or practice session in the last seven days.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentAttempts, recentSessions, completedAttempts] =
      studentIds.length
        ? await Promise.all([
            Attempt.find({
              userId: { $in: studentIds },
              createdAt: { $gte: sevenDaysAgo },
            })
              .select("userId")
              .lean(),

            PracticeSession.find({
              user: { $in: studentIds },
              createdAt: { $gte: sevenDaysAgo },
            })
              .select("user")
              .lean(),

            Attempt.find({
              userId: { $in: studentIds },
              status: {
                $in: ["completed", "submitted", "auto-submitted"],
              },
              accuracy: { $ne: null },
            })
              .select("userId subjectId accuracy")
              .populate("subjectId", "name")
              .lean(),
          ])
        : [[], [], []];

    const activeStudentIds = new Set([
      ...recentAttempts.map((item) => item.userId.toString()),
      ...recentSessions.map((item) => item.user.toString()),
    ]);

    const averageAccuracy =
      completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce(
              (total, item) => total + item.accuracy,
              0
            ) / completedAttempts.length
          )
        : null;

    const subjectStats = {};

    for (const attempt of completedAttempts) {
      const subject = attempt.subjectId;

      if (!subject) continue;

      const subjectId = subject._id.toString();

      if (!subjectStats[subjectId]) {
        subjectStats[subjectId] = {
          subject: subject.name,
          attempts: 0,
          totalAccuracy: 0,
        };
      }

      subjectStats[subjectId].attempts += 1;
      subjectStats[subjectId].totalAccuracy += attempt.accuracy;
    }

    const subjectPerformance = Object.values(subjectStats).map(
      (item) => ({
        subject: item.subject,
        attempts: item.attempts,
        averageAccuracy: Math.round(
          item.totalAccuracy / item.attempts
        ),
      })
    );

    const now = new Date();

    const assignmentSummary = {
      total: assignments.length,
      pending: assignments.filter(
        (item) => item.status === "pending"
      ).length,
      completed: assignments.filter(
        (item) => item.status === "completed"
      ).length,
      overdue:
        assignments.filter(
          (item) =>
            item.status === "overdue" ||
            (item.status === "pending" &&
              item.dueDate &&
              new Date(item.dueDate) < now)
        ).length,
    };

    return res.status(200).json({
      success: true,
      message: "Teacher dashboard retrieved successfully",
      data: {
        teacher: {
          id: req.user._id || req.user.id,
          fullName: req.user.fullName,
          role: req.user.role,
        },
        summary: {
          totalClasses: classes.length,
          totalStudents: studentIds.length,
          activeStudents: activeStudentIds.size,
          totalAssignments: assignments.length,
          averageAccuracy,
        },
        classes: classes.map((item) => ({
          id: item._id,
          name: item.name,
          description: item.description,
          subjects: item.subjects,
          totalStudents: item.students.length,
          students: item.students,
          isActive: item.isActive,
        })),
        assignments: assignments.map((item) => ({
          id: item._id,
          title: item.title,
          subject: item.subject,
          class: item.class,
          questionCount: item.questions.length,
          postDate: item.postDate,
          dueDate: item.dueDate,
          status: item.status,
        })),
        assignmentSummary,
        subjectPerformance,
        completionRate: null,
      },
    });
  } catch (error) {
    console.error("TEACHER DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve teacher dashboard",
      data: {},
    });
  }
};
