import Dexie from "dexie";

class AuthorStudioDB extends Dexie {
  constructor() {
    super("author-studio-db");
    this.version(1).stores({
      projects: "id, updatedAt, bookTitle, authorName",
    });
  }
}

export const db = new AuthorStudioDB();

export const projectRepository = {
  list: () => db.projects.orderBy("updatedAt").reverse().toArray(),
  save: (project) => db.projects.put(project),
  delete: (id) => db.projects.delete(id),
  get: (id) => db.projects.get(id),
};
