import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        students: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                index: true
            }
        ],
        subjects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Subject",
                index: true
            }
        ],
        isActive: {
            type: Boolean,
            default: true
        },
    }, { timestamps: true }
);

//TO PREVENT DUPLICATE STUDENTS IN THE CLASS
classSchema.path("students").validate(function (students) {
    const studentIds = students.map(student => student.toString());
    return studentIds.length === new Set(studentIds).size;
});

const Class = mongoose.model("Class", classSchema);
export default Class;