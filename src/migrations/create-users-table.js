'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('users', 'users_email_unique');
      await queryInterface.removeIndex('users', 'users_name_unique');
    } catch (error) {
    }
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_login_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      status: {
        type: Sequelize.ENUM('active', 'blocked'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });

    
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      where: {
        deleted_at: null
      },
      name: 'users_email_active_key'
    });

 
    await queryInterface.addIndex('users', ['name'], {
      unique: true,
      where: {
        deleted_at: null
      },
      name: 'users_name_active_key'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'users_name_active_key');
    await queryInterface.removeIndex('users', 'users_email_active_key');
    await queryInterface.dropTable('users');
  }
};