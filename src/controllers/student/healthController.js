const HealthRecord = require('../../models/HealthRecord');
const User = require('../../models/User');
const { success, error } = require('../../utils/responseFormatter');
const { getStartOfDay, getEndOfDay, getWeekRange, getMonthRange } = require('../../utils/dateUtils');

exports.addHealthRecord = async (req, res) => {
  try {
    const {
      date,
      weight,
      height,
      bloodPressure,
      bloodSugar,
      temperature,
      heartRate,
      sleepHours,
      exerciseMinutes,
      waterIntake,
      symptoms,
      notes
    } = req.body;

    const recordDate = date ? new Date(date) : new Date();
    const existingRecord = await HealthRecord.findOne({
      user: req.user._id,
      date: {
        $gte: getStartOfDay(recordDate),
        $lte: getEndOfDay(recordDate)
      }
    });

    if (existingRecord) {

      Object.assign(existingRecord, {
        weight,
        height,
        bloodPressure,
        bloodSugar,
        temperature,
        heartRate,
        sleepHours,
        exerciseMinutes,
        waterIntake,
        symptoms,
        notes
      });
      await existingRecord.save();

      success(res, existingRecord, '健康记录更新成功');
    } else {

      const record = await HealthRecord.create({
        user: req.user._id,
        date: recordDate,
        weight,
        height,
        bloodPressure,
        bloodSugar,
        temperature,
        heartRate,
        sleepHours,
        exerciseMinutes,
        waterIntake,
        symptoms,
        notes
      });

      if (weight || height) {
        const updateData = {};
        if (weight) updateData.weight = weight;
        if (height) updateData.height = height;
        await User.findByIdAndUpdate(req.user._id, updateData);
      }

      success(res, record, '健康记录添加成功', 201);
    }
  } catch (err) {
    console.error(err);
    error(res, '添加健康记录失败', 500);
  }
};

exports.getHealthRecords = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, pageSize = 30 } = req.query;
    const skip = (page - 1) * pageSize;

    const filter = { user: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await HealthRecord.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));

    const total = await HealthRecord.countDocuments(filter);

    success(res, {
      records,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, '获取健康记录失败', 500);
  }
};

exports.getTodayHealth = async (req, res) => {
  try {
    const today = new Date();
    const record = await HealthRecord.findOne({
      user: req.user._id,
      date: {
        $gte: getStartOfDay(today),
        $lte: getEndOfDay(today)
      }
    });

    if (!record) {
      return success(res, null);
    }

    success(res, record);
  } catch (err) {
    console.error(err);
    error(res, '获取今日健康记录失败', 500);
  }
};

exports.getHealthTrends = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let dateRange;

    if (period === 'week') {
      dateRange = getWeekRange();
    } else if (period === 'month') {
      dateRange = getMonthRange();
    } else {
      return error(res, '无效的时间周期', 400);
    }

    const records = await HealthRecord.find({
      user: req.user._id,
      date: {
        $gte: dateRange.start,
        $lte: dateRange.end
      }
    }).sort({ date: 1 });

    const trends = {
      dates: records.map(r => r.date),
      weight: records.map(r => r.weight || null),
      bmi: records.map(r => r.bmi || null),
      sleepHours: records.map(r => r.sleepHours || null),
      exerciseMinutes: records.map(r => r.exerciseMinutes || null),
      waterIntake: records.map(r => r.waterIntake || null),
      heartRate: records.map(r => r.heartRate || null)
    };

    const calculateAvg = (arr) => {
      const validValues = arr.filter(v => v !== null);
      if (validValues.length === 0) return 0;
      return Number((validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1));
    };

    const averages = {
      weight: calculateAvg(trends.weight),
      bmi: calculateAvg(trends.bmi),
      sleepHours: calculateAvg(trends.sleepHours),
      exerciseMinutes: calculateAvg(trends.exerciseMinutes),
      waterIntake: calculateAvg(trends.waterIntake),
      heartRate: calculateAvg(trends.heartRate)
    };

    success(res, {
      trends,
      averages,
      recordCount: records.length
    });
  } catch (err) {
    console.error(err);
    error(res, '获取健康趋势失败', 500);
  }
};

exports.getHealthAssessment = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { start, end } = getWeekRange();

    const weekRecords = await HealthRecord.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const assessment = {
      overall: 'good',
      score: 0,
      recommendations: [],
      concerns: []
    };

    if (user.weight && user.height) {
      const heightInMeters = user.height / 100;
      const bmi = user.weight / (heightInMeters * heightInMeters);

      if (bmi < 18.5) {
        assessment.concerns.push('BMI偏低，建议增加营养摄入');
        assessment.score += 60;
      } else if (bmi >= 18.5 && bmi < 24) {
        assessment.score += 100;
      } else if (bmi >= 24 && bmi < 28) {
        assessment.concerns.push('BMI偏高，建议控制饮食和增加运动');
        assessment.score += 70;
      } else {
        assessment.concerns.push('BMI过高，请咨询医生');
        assessment.score += 50;
      }
    }

    const avgSleep = weekRecords
      .filter(r => r.sleepHours)
      .reduce((sum, r) => sum + r.sleepHours, 0) / weekRecords.length || 0;

    if (avgSleep < 6) {
      assessment.concerns.push('睡眠不足，建议保证每天7-8小时睡眠');
      assessment.score += 50;
    } else if (avgSleep >= 7 && avgSleep <= 9) {
      assessment.score += 100;
    } else {
      assessment.recommendations.push('注意睡眠质量');
      assessment.score += 80;
    }

    const avgExercise = weekRecords
      .filter(r => r.exerciseMinutes)
      .reduce((sum, r) => sum + r.exerciseMinutes, 0) / weekRecords.length || 0;

    if (avgExercise < 30) {
      assessment.recommendations.push('建议每天至少运动30分钟');
      assessment.score += 60;
    } else {
      assessment.score += 100;
    }

    const avgWater = weekRecords
      .filter(r => r.waterIntake)
      .reduce((sum, r) => sum + r.waterIntake, 0) / weekRecords.length || 0;

    if (avgWater < 1500) {
      assessment.recommendations.push('建议每天饮水1500-2000ml');
      assessment.score += 70;
    } else {
      assessment.score += 100;
    }

    const totalScore = Math.round(assessment.score / 4);

    if (totalScore >= 90) {
      assessment.overall = 'excellent';
    } else if (totalScore >= 75) {
      assessment.overall = 'good';
    } else if (totalScore >= 60) {
      assessment.overall = 'fair';
    } else {
      assessment.overall = 'poor';
    }

    assessment.score = totalScore;

    success(res, assessment);
  } catch (err) {
    console.error(err);
    error(res, '获取健康评估失败', 500);
  }
};

