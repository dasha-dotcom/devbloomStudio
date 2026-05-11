import { requireTeacherStudent } from "@/lib/teacher/require-teacher-student";

type TeacherStudentDetailPageProps = {
  params: Promise<{
    classId: string;
    studentId: string;
  }>;
};

export default async function TeacherStudentDetailPage({ params }: TeacherStudentDetailPageProps) {
  const { classId, studentId } = await params;
  const { teacherStudent } = await requireTeacherStudent(classId, studentId);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Student detail</span>
          <h1 className="section-title">{teacherStudent.displayName}</h1>
        </div>
        <p className="section-copy">{teacherStudent.className}</p>
      </div>

      <div className="glass-card teacher-panel">
        <strong>Profile</strong>
        <div className="teacher-meta-grid">
          <div className="teacher-meta-card">
            <span className="muted">Status</span>
            <strong>{teacherStudent.isActive ? "Active" : "Inactive"}</strong>
          </div>
          <div className="teacher-meta-card">
            <span className="muted">Created</span>
            <strong>{teacherStudent.createdAt.toLocaleDateString()}</strong>
          </div>
          <div className="teacher-meta-card">
            <span className="muted">Join code</span>
            <strong>{teacherStudent.joinCode}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
