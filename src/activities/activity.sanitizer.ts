export function sanitizeActivityForStudent(activity: any) {
  return {
    id: activity._id?.toString?.() ?? activity.id,
    descricao: activity.descricao,
    createdAt: activity.createdAt,
    questionario: (activity.questionario ?? []).map((q: any) => ({
      enunciado: q.enunciado,
      assunto: q.assunto,
      alternativas: q.alternativas,
      // respostaCerta removida
    })),
  };
}
