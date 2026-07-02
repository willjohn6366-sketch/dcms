const dataService = require('../services/data-service');
const { success } = require('../utils/response');

class DataController {
  async exportAll(req, res, next) {
    try {
      const backup = await dataService.exportAll();
      const stamp = backup.exported_at.replace(/[-:]/g, '').slice(0, 15);
      res.setHeader('Content-Disposition', `attachment; filename="circuit-backup-${stamp}.json"`);
      res.json(success(backup));
    } catch (error) {
      next(error);
    }
  }

  async createBackup(req, res, next) {
    try {
      const backup = await dataService.createBackup();
      res.status(201).json(success(backup, '备份已创建'));
    } catch (error) {
      next(error);
    }
  }

  async listBackups(req, res, next) {
    try {
      const backups = await dataService.listBackups();
      res.json(success(backups));
    } catch (error) {
      next(error);
    }
  }

  async getBackup(req, res, next) {
    try {
      const backup = await dataService.getBackup(req.params.filename);
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
      res.json(success(backup));
    } catch (error) {
      next(error);
    }
  }

  async restoreBackup(req, res, next) {
    try {
      const summary = await dataService.restoreBackup(req.params.filename);
      res.json(success(summary, '备份已还原'));
    } catch (error) {
      next(error);
    }
  }

  async importOverwrite(req, res, next) {
    try {
      const summary = await dataService.importOverwrite(req.body);
      res.json(success(summary, '数据已覆盖导入'));
    } catch (error) {
      next(error);
    }
  }

  async clearAll(req, res, next) {
    try {
      const summary = await dataService.clearAll();
      res.json(success(summary, '数据库已清空，备份文件已保留'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DataController();
