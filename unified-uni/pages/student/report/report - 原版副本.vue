<template>
	<layout>
		<scroll-view class="page-scroll" :scroll-y="true" :refresher-enabled="true" :refresher-triggered="refreshing"
			:refresher-threshold="80" @refresherrefresh="onRefresherRefresh">
			<view class="report-container">
				<!-- 加载状态 -->
				<view v-if="loading" class="loading-container">
					<view class="loading-spinner"></view>
					<text class="loading-text">加载中...</text>
				</view>

				<!-- 报告内容 -->
				<view v-else class="report-content">
					<!-- 报告头部 -->
					<report-header v-model:report-type="reportType" />

					<!-- weekly内容 -->
					<weekly-report v-if="reportType === 'weekly'" :weeklyData="weeklyData" />

					<!-- 月报内容 -->
					<monthly-report v-else :monthlyData="monthlyData" />

					<!-- AI智能分析报告 -->
					<ai-report-card :report-type="reportType" :ai-report="aiReport" :report-history="reportHistory"
						:generating-report="generatingReport" :generating-status="generatingStatus"
						@generate-report="generateNewAIReport" @show-history="showHistoryModal = true" />

					<!-- 历史报告弹窗 -->
					<history-report-modal :show-modal="showHistoryModal" :report-type="reportType" :report-history="reportHistory"
						:loading-history="loadingHistory" @close="showHistoryModal = false" @view-report="viewHistoryReport" />
				</view>
			</view>
		</scroll-view>
	</layout>
</template>

<script setup>
	import {
		ref,
		onMounted,
		onUnmounted,
		watch,
		unref
	} from "vue";
	import layout from "@/components/layout.vue";

	// 导入组件
	import reportHeader from "./components/reportHeader.vue";
	import weeklyReport from "./components/weeklyReport.vue";
	import monthlyReport from "./components/monthlyReport.vue";
	import aiReportCard from "./components/aiReportCard.vue";
	import historyReportModal from "./components/historyReportModal.vue";
	import {
		getWeeklyReport,
		getAiReportApi,
		generateAIReport,
		getMonthlyReport
	} from "@/api/student/report";

	const weeklyData = ref({
		weekRange: "",
		dailyCalories: [],
		days: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
		avgCalories: 0,
		targetCalories: 0,
		calorieDeficit: 0,
		avgSugar: 0,
		nutritionScore: {
			carbs: 0,
			protein: 0,
			fat: 0,
			fiber: 0,
			vitamin: 0,
		},
	});

	// 获取周报数据
	const fetchWeeklyData = async () => {
		// 1. 调用 API，直接解构出 data 
		const {
			data
		} = await getWeeklyReport();

		// 2. 赋值给响应式变量，驱动视图更新
		weeklyData.value = data;
	};

	const monthlyData = ref({
		month: "",
		dailyCalories: Array.from({
			length: 31
		}, () => Math.floor(Math.random() * 600) + 1600),
		avgCalories: 0,
		targetCalories: 0,
	});
	const fetchMonthlyData = async () => {
		const res = await getMonthlyReport();
		monthlyData.value = res.data;
	};
	fetchWeeklyData();
	fetchMonthlyData();
	// 下拉刷新状态
	const refreshing = ref(false);
	const reportType = ref("weekly");
	const loading = ref(false);
	const generatingReport = ref(false);
	const generatingStatus = ref("");
	const aiReport = ref(null);
	const reportHistory = ref([]);
	const showHistoryModal = ref(false);
	const loadingHistory = ref(false);

	// 生成新的AI报告
	const generateNewAIReport = async () => {
		// 1. 防止用户重复点击
		if (generatingReport.value) {
			return
		};
		generatingReport.value = true;

		try {
			// 2. 设置状态文案
			generatingStatus.value = "AI正在深度思考...";

			// 3. 请求获取数据
			const { data } = await generateAIReport({
				reportType: unref(reportType)
			});
			
			// 4. 拿到结果直接展示
			aiReport.value = data.content;
			
			// 5. 弹出生成成功信息
			uni.showToast({
				title: "生成成功",
				icon: "success"
			});
		} catch (error) {
			console.error("生成失败:", error);
			uni.showToast({
				title: "生成失败，请重试",
				icon: "none"
			});
		} finally {
			generatingReport.value = false;
			generatingStatus.value = "";
		}
	};

	// 获取报告历史
	const fetchReportHistory = async () => {
		loadingHistory.value = true;
		try {
			const res = await getAiReportApi({
				reportType: reportType.value,
				limit: 99
			});
			reportHistory.value = res.data.reports;
		} catch (error) {
			console.error("获取报告历史失败:", error);
		} finally {
			loadingHistory.value = false;
		}
	};

	// 查看历史报告
	const viewHistoryReport = (report) => {
		aiReport.value = report.content;
		showHistoryModal.value = false;
		uni.showToast({
			title: "已加载历史报告",
			icon: "success",
			duration: 1500,
		});
	};

	// 监听报告类型变化
	watch(reportType, async (newType) => {
		aiReport.value = null;
		if (newType === "weekly") {
			fetchWeeklyData();
		} else {
			fetchMonthlyData();
		}
		fetchReportHistory();
	});

	fetchReportHistory();

	// 下拉刷新处理
	const onRefresherRefresh = async () => {
		refreshing.value = true;
		try {
			// 刷新当前类型的数据与历史
			if (reportType.value === "weekly") {
				await fetchWeeklyData();
			} else {
				await fetchMonthlyData();
			}
			await fetchReportHistory();
		} catch (e) {
			console.error("下拉刷新失败:", e);
		} finally {
			// 平滑关闭
			setTimeout(() => (refreshing.value = false), 300);
		}
	};
</script>

<style scoped>
	.report-container {
		height: 100%;
		padding: 20rpx;
		background-color: #f5f7fa;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;
	}

	.loading-spinner {
		width: 80rpx;
		height: 80rpx;
		border: 8rpx solid #f0f0f0;
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 20rpx;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		font-size: 28rpx;
		color: #999;
	}

	.report-content {
		display: flex;
		flex-direction: column;
		gap: 30rpx;
		height: 100%;
	}

	.page-scroll {
		height: 100%;
	}
</style>