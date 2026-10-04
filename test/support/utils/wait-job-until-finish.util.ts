import { DataSource } from 'typeorm';

export async function waitJobUntilFinish(dataSource: DataSource, imgIds: string[], state = 'completed', waiting = 700) {
  while (true) {
    const allCompleted = await dataSource.query<{ state: string; data: { Key: string } }[]>(
      `
       SELECT state, data
       FROM pgboss.job
       WHERE name = 'image.delete' AND data->>'Key' = ANY($1) AND state=$2;
     `,
      [imgIds, state],
    );
    if (allCompleted.length === imgIds.length) return allCompleted;
    await new Promise((resolve) => setTimeout(resolve, waiting));
  }
}
