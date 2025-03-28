'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.last_activity_time) {
      await queryInterface.addColumn('users', 'last_activity_time', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW')
      });
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('users', 'last_activity_time');
    } catch (error) {
      console.log('Column may have already been removed');
    }
  }
};