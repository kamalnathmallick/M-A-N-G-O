import React from 'react';
import StatCard from './StatCard';
import LatestAnalysisCard from './LatestAnalysisCard';
import WeatherOverviewCard from './WeatherOverviewCard';
import RecentAnalysesTable from './RecentAnalysesTable';
import TopRecommendations from './TopRecommendations';
import PrototypeBanner from '../layout/PrototypeBanner';
import { isEndpointLive } from '../../services/apiStatus';

export default function DashboardView({
  farms,
  selectedFarm,
  selectedPlot,
  weather,
  forecast,
  history,
  recommendations,
  onNavigate,
  onOpenResearchModal,
  onSelectRecommendation,
  onSelectHistoryRecord
}) {
  const currentFarm = farms.find(f => f.id === selectedFarm) || farms[0];
  const currentPlot = currentFarm?.plots.find(p => p.id === selectedPlot) || currentFarm?.plots[0];

  // Data-driven badges: only call isEndpointLive at render (never in effects/callbacks).
  const farmsLive = isEndpointLive('farms');
  const dataBadge = farmsLive ? 'Live Model Result' : 'Demo Data';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Main Summary Cards (As in reference image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Expected Yield */}
        <StatCard
          title="Expected Yield"
          value={currentPlot?.expectedYield || '4.8 – 5.4'}
          subtitle={currentPlot?.yieldUnit || 'tonnes / acre'}
          badgeText={dataBadge}
          badgeType="success"
          type="yield"
          onClick={() => onNavigate('yield')}
        />

        {/* Card 2: Bud Health */}
        <StatCard
          title="Bud Health"
          value={`${currentPlot?.healthScore || 78}%`}
          subtitle="Healthy Buds"
          badgeText={dataBadge}
          badgeType="default"
          type="bud"
          onClick={() => onNavigate('image-analysis')}
        />

        {/* Card 3: Flower Drop Risk */}
        <StatCard
          title="Flower Drop Risk"
          value={currentPlot?.flowerDropRisk || 'Moderate'}
          subtitle="Keep monitoring"
          badgeText={dataBadge}
          badgeType="warning"
          type="risk"
          onClick={() => onNavigate('recommendations')}
        />

        {/* Card 4: Climate Risk */}
        <StatCard
          title="Climate Risk"
          value={currentPlot?.climateRisk || 'Low - Moderate'}
          subtitle="Favorable Conditions"
          badgeText={dataBadge}
          badgeType="info"
          type="climate"
          onClick={() => onNavigate('climate')}
        />
      </div>

      {/* Middle Row: Latest Analysis Overview (Left) + Current Weather / 15-Day Outlook (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (5/12 on large screens) */}
        <div className="lg:col-span-5 h-full">
          <LatestAnalysisCard
            onStartAnalysis={() => onNavigate('new-analysis')}
            onViewDetailedClassification={() => onNavigate('image-analysis')}
            analysisData={currentPlot}
          />
        </div>

        {/* Right Column (7/12 on large screens) */}
        <div className="lg:col-span-7 h-full">
          <WeatherOverviewCard
            weather={weather}
            forecast={forecast}
            onViewDetailedClimate={() => onNavigate('climate')}
          />
        </div>
      </div>

      {/* Bottom Row: Recent Analyses (Left) + Top Recommendations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Recent Analyses (5/12) */}
        <div className="lg:col-span-5 h-full">
          <RecentAnalysesTable
            history={history}
            onViewAll={() => onNavigate('history')}
            onSelectRecord={(rec) => {
              if (onSelectHistoryRecord) onSelectHistoryRecord(rec);
              onNavigate('history');
            }}
          />
        </div>

        {/* Top Recommendations (7/12) */}
        <div className="lg:col-span-7 h-full">
          <TopRecommendations
            recommendations={recommendations}
            onViewAllRecommendations={() => onNavigate('recommendations')}
            onSelectRecommendation={(rec) => {
              if (onSelectRecommendation) onSelectRecommendation(rec);
              onNavigate('recommendations');
            }}
          />
        </div>
      </div>

      {/* Bottom Prototype Disclaimer Bar */}
      <PrototypeBanner onOpenResearchModal={onOpenResearchModal} />
    </div>
  );
}
