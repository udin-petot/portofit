import { aiRouter } from "./ai";
import { crudRouter } from "./crud";

export const applicationsRouter = {
	list: crudRouter.list,
	getById: crudRouter.getById,
	create: crudRouter.create,
	import: crudRouter.import,
	update: crudRouter.update,
	attachDocument: crudRouter.attachDocument,
	removeDocument: crudRouter.removeDocument,
	addNote: crudRouter.addNote,
	addInterview: crudRouter.addInterview,
	updateInterview: crudRouter.updateInterview,
	updateTimelineEntry: crudRouter.updateTimelineEntry,
	deleteTimelineEntry: crudRouter.deleteTimelineEntry,
	trash: crudRouter.trash,
	restore: crudRouter.restore,
	delete: crudRouter.delete,
	bulkUpdate: crudRouter.bulkUpdate,
	bulkTrash: crudRouter.bulkTrash,
	bulkDelete: crudRouter.bulkDelete,
	stats: crudRouter.stats,
	tags: crudRouter.tags,
	ai: aiRouter,
};
