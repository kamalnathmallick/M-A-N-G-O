import { weatherService } from '../services/weatherService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getCurrentWeather = async (req, res, next) => {
  try {
    const { farmId = 'farm-1' } = req.query;
    const data = await weatherService.getCurrentWeather(farmId);
    return successResponse(res, data, 'Current weather retrieved');
  } catch (error) {
    next(error);
  }
};

export const get15DayForecast = async (req, res, next) => {
  try {
    const { farmId = 'farm-1' } = req.query;
    const data = await weatherService.get15DayForecast(farmId);
    return successResponse(res, data, '15-day forecast retrieved');
  } catch (error) {
    next(error);
  }
};

export const getClimateSummary = async (req, res, next) => {
  try {
    const { farmId = 'farm-1' } = req.query;
    const data = await weatherService.getClimateSummary(farmId);
    return successResponse(res, data, 'Climate summary retrieved');
  } catch (error) {
    next(error);
  }
};
