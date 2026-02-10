'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Admin@123!', 12);
    await queryInterface.bulkInsert('users', [{
      id: uuidv4(),
      phone: '+998900000000',
      email: 'admin@gogomarke.uz',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'GoGoMarket',
      role: 'admin',
      is_verified: true,
      is_active: true,
      language: 'ru',
      one_id_verified: false,
      accepted_terms: true,
      accepted_privacy: true,
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      created_at: new Date(),
      updated_at: new Date(),
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@gogomarke.uz' });
  },
};
