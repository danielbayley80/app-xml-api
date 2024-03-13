import express from 'express';
import { container } from './common/injector';


const pageController = container.resolve("pageController")
const processController = container.resolve("processController")
const dataStoreController = container.resolve("dataStoreController")

export const router = express.Router();

 
router.get('/spider/getPage', pageController.getPage.bind(pageController));
 
router.post('/spider/initiate', processController.initiate.bind(processController )); 
router.get('/spider/nextTask', processController.nextTask.bind(processController )); 
router.get('/spider/stats', processController.getStats.bind(processController )); 

router.post('/data/add', dataStoreController.writeData.bind(dataStoreController)); 
router.get('/data/getAll', dataStoreController.getData.bind(dataStoreController)); 
//router.get('/spider/getPage', pageController.getPageHtml.bind(pageController)); 

export default router;



 