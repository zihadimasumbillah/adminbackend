'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_activity_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true, 
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_deleted_user: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      activity_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      session_minutes: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      session_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      }
    });

    await queryInterface.addIndex('user_activity_history', ['user_id']);
    await queryInterface.addIndex('user_activity_history', ['email']);
    await queryInterface.addIndex('user_activity_history', ['activity_date']);
    
    await queryInterface.addIndex('user_activity_history', 
      ['email', 'activity_date', 'day_of_week'], 
      { unique: true }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_activity_history');
  }
};