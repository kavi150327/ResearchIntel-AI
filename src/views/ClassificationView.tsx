import React, { useState } from 'react';
import {
  BrainCircuit,
  Sliders,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BarChart3,
  Send,
  Check,
  TrendingUp
} from 'lucide-react';
import {
  EvaluationResults,
  ModelType,
  ResearchPaper,
  TfidfConfig
} from '../types';
import {
  DEFAULT_TFIDF_CONFIG,
  trainAndEvaluateClassifier,
  transformTfidf
} from '../services/mlEngine';
import { preprocessText, DEFAULT_PREPROCESSING_CONFIG } from '../services/nlpEngine';
import { apiClient } from '../services/apiClient';

interface ClassificationViewProps {
  papers: ResearchPaper[];
  evaluation: EvaluationResults | null;
  onUpdateEvaluation: (
    evaluation: EvaluationResults,
    updatedPapers: ResearchPaper[]
  ) => void;
}

export const ClassificationView: React.FC<ClassificationViewProps> = ({
  papers,
  evaluation,
  onUpdateEvaluation
}) => {
  const [selectedModel, setSelectedModel] = useState<ModelType>('multinomial_nb');
  const [tfidfConfig, setTfidfConfig] = useState<TfidfConfig>(DEFAULT_TFIDF_CONFIG);
  const [trainRatio, setTrainRatio] = useState<number>(0.75);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  // Live Prediction Sandbox
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxPrediction, setSandboxPrediction] = useState<{
    predictedClass: string;
    confidence: number;
    probabilities: Record<string, number>;
    topTerms: { term: string; score: number }[];
  } | null>(null);

  const [correctionCategory, setCorrectionCategory] = useState<string>('');
  const [correctionSubmitted, setCorrectionSubmitted] = useState<boolean>(false);

  const handleReportCorrection = async () => {
    if (!correctionCategory) return;
    try {
      await apiClient.submitCorrection(`pred-${Date.now()}`, correctionCategory);
      setCorrectionSubmitted(true);
      setTimeout(() => setCorrectionSubmitted(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Train and evaluate model
  const handleTrainModel = () => {
    setIsTraining(true);
    setTrainingError(null);

    setTimeout(() => {
      try {
        const result = trainAndEvaluateClassifier(papers, selectedModel, tfidfConfig, trainRatio);
        onUpdateEvaluation(result.evaluation, result.updatedPapers);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Training execution failed.';
        setTrainingError(msg);
      } finally {
        setIsTraining(false);
      }
    }, 150);
  };

  // Run live sandbox prediction
  const handleSandboxPredict = () => {
    if (!sandboxInput.trim()) return;

    try {
      // Re-train / fit lightweight classifier to classify arbitrary input
      const { classifier, tfidfModel } = trainAndEvaluateClassifier(
        papers,
        selectedModel,
        tfidfConfig,
        trainRatio
      );

      const { tokens } = preprocessText(sandboxInput, DEFAULT_PREPROCESSING_CONFIG);
      const { vector, topTerms } = transformTfidf(tokens, tfidfModel);
      const prediction = classifier.predict(vector);

      setSandboxPrediction({
        predictedClass: prediction.predictedClass,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
        topTerms
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Prediction failed.');
    }
  };

  const categories = Array.from(new Set(papers.map(p => p.category).filter(Boolean))).sort();
  const labeledCount = papers.filter(p => p.category && p.category !== 'Uncategorized').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Model Training & Hyperparameter Controls Card */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              <span>Supervised Research Classifier Training</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Fits TF-IDF representations strictly on training splits to prevent data leakage. Evaluates generalization performance on held-out test papers using accuracy, precision, recall, F1, and multi-class confusion matrices.
            </p>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={isTraining || labeledCount < 4}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
            <span>{isTraining ? 'Training Model...' : 'Train & Evaluate Model'}</span>
          </button>
        </div>

        {trainingError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{trainingError}</span>
          </div>
        )}

        {/* Hyperparameter Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 text-xs">
          {/* Model Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Machine Learning Model</label>
            <div className="space-y-1.5">
              {[
                { id: 'multinomial_nb', name: 'Multinomial Naive Bayes', desc: 'Laplace smoothing (alpha=1.0)' },
                { id: 'logistic_regression', name: 'Logistic Regression (OvR)', desc: 'L2 regularization, SGD cross-entropy' },
                { id: 'linear_svm', name: 'Linear SVM (OvR)', desc: 'Pegasos hinge-loss subgradient' }
              ].map(m => (
                <label
                  key={m.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedModel === m.id
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={selectedModel === m.id}
                    onChange={() => setSelectedModel(m.id as ModelType)}
                    className="mt-0.5 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold block">{m.name}</span>
                    <span className="text-[10px] text-slate-400 block">{m.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* TF-IDF Parameters */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Max Vocabulary Features: <span className="text-cyan-400 font-mono">{tfidfConfig.maxFeatures}</span>
              </label>
              <select
                value={tfidfConfig.maxFeatures}
                onChange={e => setTfidfConfig({ ...tfidfConfig, maxFeatures: parseInt(e.target.value, 10) })}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="150">150 Features (Compact)</option>
                <option value="350">350 Features (Balanced)</option>
                <option value="500">500 Features (High Resolution)</option>
                <option value="1000">1,000 Features (Maximum)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={tfidfConfig.useBigrams}
                onChange={e => setTfidfConfig({ ...tfidfConfig, useBigrams: e.target.checked })}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Extract Bigrams (1-2 n-grams)</span>
                <span className="text-[10px] text-slate-400">Captures word pairings (e.g. cross_lingual)</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={tfidfConfig.sublinearTf}
                onChange={e => setTfidfConfig({ ...tfidfConfig, sublinearTf: e.target.checked })}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Sublinear TF Scaling</span>
                <span className="text-[10px] text-slate-400">Applies 1 + ln(count) dampening</span>
              </div>
            </label>
          </div>

          {/* Train/Test Split */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Train / Held-Out Test Split Ratio
              </label>
              <select
                value={trainRatio}
                onChange={e => setTrainRatio(parseFloat(e.target.value))}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="0.70">70% Train / 30% Test</option>
                <option value="0.75">75% Train / 25% Test (Standard)</option>
                <option value="0.80">80% Train / 20% Test</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Available Labeled Papers:</span>
                <span className="font-mono text-cyan-300 font-semibold">{labeledCount}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Unique Category Classes:</span>
                <span className="font-mono text-cyan-300 font-semibold">{categories.length}</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                Stratified partitioning ensures uniform domain representation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Held-out Evaluation Results */}
      {evaluation ? (
        <div className="space-y-6">
          {/* Primary Metric Score Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-[#0D1527] border border-cyan-500/30">
              <span className="text-xs text-cyan-400 font-medium block">Overall Test Accuracy</span>
              <span className="text-3xl font-bold font-mono text-white mt-1 block">
                {(evaluation.accuracy * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {evaluation.testCount} held-out papers
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">Macro F1-Score</span>
              <span className="text-3xl font-bold font-mono text-emerald-400 mt-1 block">
                {evaluation.macroF1.toFixed(3)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Unweighted class mean</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">Macro Precision</span>
              <span className="text-3xl font-bold font-mono text-sky-400 mt-1 block">
                {evaluation.macroPrecision.toFixed(3)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Avg TP / (TP + FP)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block">Macro Recall</span>
              <span className="text-3xl font-bold font-mono text-violet-400 mt-1 block">
                {evaluation.macroRecall.toFixed(3)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Avg TP / (TP + FN)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800 col-span-2 lg:col-span-1">
              <span className="text-xs text-slate-400 font-medium block">Training Set Size</span>
              <span className="text-3xl font-bold font-mono text-slate-200 mt-1 block">
                {evaluation.trainCount}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {evaluation.featureCount} TF-IDF features
              </span>
            </div>
          </div>

          {/* Per-Class Performance Table */}
          <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
            <h4 className="text-sm font-bold text-white tracking-tight mb-3">
              Per-Category Classification Metrics (Held-Out Test Set)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Research Category</th>
                    <th className="py-2.5 px-3 font-semibold">Precision</th>
                    <th className="py-2.5 px-3 font-semibold">Recall</th>
                    <th className="py-2.5 px-3 font-semibold">F1-Score</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Support (Test Instances)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(evaluation.perClass).map(([catName, metrics]) => (
                    <tr key={catName} className="hover:bg-slate-800/25 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-200">{catName}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-300">
                        {metrics.precision.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-300">
                        {metrics.recall.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-white font-bold">
                        {metrics.f1.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-slate-400">
                        {metrics.support}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion Matrix Visualization */}
          <div className="p-5 rounded-xl bg-[#0D1527] border border-slate-800/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Multi-Class Confusion Matrix</h4>
                <p className="text-xs text-slate-400">
                  Rows represent actual category labels; columns represent model predictions on held-out test data.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-500 font-mono text-[11px] border border-slate-800">
                      Actual \ Pred
                    </th>
                    {evaluation.confusionMatrix.labels.map(l => (
                      <th
                        key={l}
                        className="p-2 font-mono text-[10px] text-cyan-400 border border-slate-800 max-w-[90px] truncate"
                        title={l}
                      >
                        {l.slice(0, 10)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluation.confusionMatrix.matrix.map((row, rIdx) => {
                    const actualLabel = evaluation.confusionMatrix.labels[rIdx];
                    return (
                      <tr key={actualLabel}>
                        <td
                          className="p-2 text-left font-semibold text-slate-300 border border-slate-800 max-w-[120px] truncate"
                          title={actualLabel}
                        >
                          {actualLabel}
                        </td>
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          const isError = !isDiagonal && val > 0;
                          return (
                            <td
                              key={cIdx}
                              className={`p-2 font-mono font-bold border border-slate-800 transition-colors ${
                                isDiagonal
                                  ? val > 0
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'text-slate-600'
                                  : isError
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'text-slate-600'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-[#0D1527] border border-slate-800/80 text-center">
          <BrainCircuit className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">Classifier Not Yet Evaluated</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Click 'Train &amp; Evaluate Model' above to execute real TF-IDF feature extraction, fit the classifier, and inspect genuine held-out evaluation metrics.
          </p>
        </div>
      )}

      {/* Live Abstract Classifier Sandbox */}
      <div className="p-6 rounded-xl bg-[#0D1527] border border-cyan-500/30 space-y-4">
        <div>
          <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Live Abstract Prediction Sandbox</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Test the trained classifier on any unseen research abstract. Vectorizes through the fitted TF-IDF pipeline and outputs predicted category with calibrated posterior probability distribution.
          </p>
        </div>

        <div>
          <textarea
            rows={3}
            placeholder="Paste a novel research abstract here to classify in real time (e.g. 'We present a self-supervised vision transformer for autonomous drone depth perception...')..."
            value={sandboxInput}
            onChange={e => setSandboxInput(e.target.value)}
            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSandboxInput(
                'We formulate a novel neural graph attention network for discovering zero-day polymorphism in stripped binary malware executables.'
              );
            }}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Load Example Abstract
          </button>

          <button
            onClick={handleSandboxPredict}
            disabled={!sandboxInput.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Classify Abstract</span>
          </button>
        </div>

        {sandboxPrediction && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Predicted Domain Category</span>
                <span className="text-lg font-bold text-cyan-300 block">
                  {sandboxPrediction.predictedClass}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Model Confidence</span>
                <span className="text-lg font-mono font-bold text-emerald-400 block">
                  {(sandboxPrediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Probability Bars */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block">Class Probabilities</span>
              {Object.entries(sandboxPrediction.probabilities)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, prob]) => (
                  <div key={cat} className="flex items-center gap-3 text-xs">
                    <span className="w-36 truncate text-slate-300 text-[11px]">{cat}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, prob * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-[10px] text-slate-400">
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>

            {/* Human-in-the-Loop Active Feedback */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Human-in-the-Loop Review:</span>
                {correctionSubmitted && (
                  <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Feedback Saved to SQLite</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={correctionCategory}
                  onChange={e => setCorrectionCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Report Correct Domain Category...</option>
                  {[
                    'Artificial Intelligence',
                    'Machine Learning',
                    'Deep Learning',
                    'Natural Language Processing',
                    'Computer Vision',
                    'Data Science',
                    'Cybersecurity',
                    'Healthcare AI',
                    'Distributed Computing',
                    'Other / Uncertain'
                  ].map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleReportCorrection}
                  disabled={!correctionCategory || correctionSubmitted}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                >
                  Submit Correction Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
