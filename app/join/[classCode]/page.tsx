import { AppShell } from "@/components/app-shell";
import { JoinForm } from "@/components/student/join-form";
import { getJoinPageData } from "@/app/join/actions";

type JoinClassPageProps = {
  params: Promise<{
    classCode: string;
  }>;
};

export default async function JoinClassPage({ params }: JoinClassPageProps) {
  const { classCode } = await params;
  const joinPageData = await getJoinPageData(classCode);

  return (
    <AppShell>
      <section className="section student-page-section">
        {joinPageData ? (
          <div className="teacher-grid">
            <div className="glass-card teacher-panel student-join-summary">
              <span className="eyebrow">Student join</span>
              <h1 className="section-title">{joinPageData.teacherClass.name}</h1>
              <p className="section-copy">
                Join code <strong>{joinPageData.teacherClass.joinCode}</strong>
              </p>
              <p className="muted teacher-panel-copy" style={{ marginTop: 16 }}>
                Choose your name from the class roster and use your 6-digit PIN to sign in on this device.
              </p>
            </div>

            <JoinForm
              classCode={joinPageData.teacherClass.joinCode}
              className={joinPageData.teacherClass.name}
              students={joinPageData.activeStudents.map((student) => ({
                id: student.id,
                displayName: student.displayName,
              }))}
            />
          </div>
        ) : (
          <div className="glass-card teacher-panel student-empty-state">
            <span className="eyebrow">Student join</span>
            <h1 className="section-title">This class link is not valid.</h1>
            <p className="section-copy">
              Check the class code with your teacher, or go back to the project library.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
