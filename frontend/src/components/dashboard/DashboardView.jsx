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

  // Newest REAL run from MongoDB that belongs to THIS farm+plot (history is
  // refetched after every analysis in App.jsx). Falls back to the plot's own
  // summary only when no real run exists for this plot.
  const latestRealRun = (history || []).find(
    (r) =>
      r.isDemo === false &&
      r.farmId === currentFarm?.id &&
      r.plot === String(currentPlot?.id || '').toUpperCase()
  );
  // Cards fed by the run itself (yield/health/drop-risk are written back to the
  // plot after a real analysis) may claim "Live Model Result" only when such a
  // run exists for THIS plot and the farms endpoint is actually answering.
  // Card 4 (climateRisk) is never written by an analysis, so it keeps dataBadge.
  const analysisData = latestRealRun
    ? {
        lastAnalysisDate:
          [latestRealRun.date, latestRealRun.time].filter(Boolean).join(', ') || null,
        sampleCount: latestRealRun.sampleCount ?? null,
        confidence: latestRealRun.confidence ?? null,
        floweringStage: currentPlot?.floweringStage || 'Active',
        healthScore: latestRealRun.budHealth ?? currentPlot?.healthScore ?? null,
        flowerDropRisk: latestRealRun.flowerDropRisk || currentPlot?.flowerDropRisk,
        climateRisk: latestRealRun.climateCondition || currentPlot?.climateRisk
      }
    : currentPlot;

  // Data-driven badges: only call isEndpointLive at render (never in effects/callbacks).
  // Honest on both counts: the endpoint must have answered AND the payload must
  // not be flagged isDemo (the backend serves 200 + demo farms while MongoDB is offline).
  const farmsLive = isEndpointLive('farms');
  const dataBadge = farmsLive && currentFarm?.isDemo === false ? 'Live Model Result' : 'Demo Data';
  const plotRunBadge =
    farmsLive && latestRealRun ? 'Live Model Result' : dataBadge;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Main Summary Cards (As in reference image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Expected Yield */}
        <StatCard
          title="Expected Yield"
          value={currentPlot?.expectedYield ?? '—'}
          subtitle={currentPlot?.yieldUnit || 'tonnes / acre'}
          badgeText={plotRunBadge}
          badgeType="success"
          type="yield"
          onClick={() => onNavigate('yield')}
        />

        {/* Card 2: Bud Health */}
        <StatCard
          title="Bud Health"
          value={currentPlot?.healthScore != null ? `${currentPlot.healthScore}%` : '—'}
          subtitle="Healthy Buds"
          badgeText={plotRunBadge}
          badgeType="default"
          type="bud"
          onClick={() => onNavigate('image-analysis')}
        />

        {/* Card 3: Flower Drop Risk */}
        <StatCard
          title="Flower Drop Risk"
          value={currentPlot?.flowerDropRisk ?? '—'}
          subtitle="Keep monitoring"
          badgeText={plotRunBadge}
          badgeType="warning"
          type="risk"
          onClick={() => onNavigate('recommendations')}
        />

        {/* Card 4: Climate Risk */}
        <StatCard
          title="Climate Risk"
          value={currentPlot?.climateRisk ?? '—'}
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
            analysisData={analysisData}
            // Demo fallbacks (fixed date/94.2%/4 samples) are only allowed when
            // no real run exists; a real record must never be padded with them.
            isDemoData={!latestRealRun}
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
