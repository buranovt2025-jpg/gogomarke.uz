import { Response } from 'express';
import { Address } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const addresses = await Address.findAll({
      where: { userId: user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ success: false, error: 'Failed to get addresses' });
  }
};

export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { title, fullName, phone, address, city, district, postalCode, latitude, longitude, isDefault } = req.body;

    // If this is the first address or isDefault is true, make it default
    const existingAddresses = await Address.count({ where: { userId: user.id } });
    const shouldBeDefault = existingAddresses === 0 || isDefault === true;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      await Address.update({ isDefault: false }, { where: { userId: user.id } });
    }

    const newAddress = await Address.create({
      userId: user.id,
      title,
      fullName,
      phone,
      address,
      city,
      district,
      postalCode,
      latitude,
      longitude,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      data: newAddress,
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ success: false, error: 'Failed to create address' });
  }
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const addressRecord = await Address.findByPk(id);

    if (!addressRecord) {
      res.status(404).json({ success: false, error: 'Address not found.' });
      return;
    }

    if (addressRecord.userId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only update your own addresses.' });
      return;
    }

    const { title, fullName, phone, address, city, district, postalCode, latitude, longitude, isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await Address.update({ isDefault: false }, { where: { userId: user.id } });
    }

    if (title !== undefined) addressRecord.title = title;
    if (fullName !== undefined) addressRecord.fullName = fullName;
    if (phone !== undefined) addressRecord.phone = phone;
    if (address !== undefined) addressRecord.address = address;
    if (city !== undefined) addressRecord.city = city;
    if (district !== undefined) addressRecord.district = district;
    if (postalCode !== undefined) addressRecord.postalCode = postalCode;
    if (latitude !== undefined) addressRecord.latitude = latitude;
    if (longitude !== undefined) addressRecord.longitude = longitude;
    if (isDefault !== undefined) addressRecord.isDefault = isDefault;

    await addressRecord.save();

    res.json({
      success: true,
      data: addressRecord,
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ success: false, error: 'Failed to update address' });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const addressRecord = await Address.findByPk(id);

    if (!addressRecord) {
      res.status(404).json({ success: false, error: 'Address not found.' });
      return;
    }

    if (addressRecord.userId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only delete your own addresses.' });
      return;
    }

    const wasDefault = addressRecord.isDefault;
    await addressRecord.destroy();

    // If deleted address was default, make another one default
    if (wasDefault) {
      const firstAddress = await Address.findOne({
        where: { userId: user.id },
        order: [['createdAt', 'ASC']],
      });
      if (firstAddress) {
        firstAddress.isDefault = true;
        await firstAddress.save();
      }
    }

    res.json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
};

export const setDefaultAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const { id } = req.params;
    const addressRecord = await Address.findByPk(id);

    if (!addressRecord) {
      res.status(404).json({ success: false, error: 'Address not found.' });
      return;
    }

    if (addressRecord.userId !== user.id) {
      res.status(403).json({ success: false, error: 'You can only update your own addresses.' });
      return;
    }

    // Unset all other defaults
    await Address.update({ isDefault: false }, { where: { userId: user.id } });

    // Set this one as default
    addressRecord.isDefault = true;
    await addressRecord.save();

    res.json({
      success: true,
      data: addressRecord,
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ success: false, error: 'Failed to set default address' });
  }
};
