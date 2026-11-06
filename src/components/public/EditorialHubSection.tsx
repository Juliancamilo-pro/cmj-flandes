import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Calendar,
  MapPin,
  TrendingUp,
  Eye,
  MessageSquare,
  Award,
  Users,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import {
  Article,
  AuthorProfile,
  CitizenPoll,
  EditorialEvent,
  CollaboratorRecognition
} from '../../types';
import {
  getCitizenPolls,
  voteInCitizenPoll,
  getEditorialEvents,
  getCollaboratorRecognitions
} from '../../services/db';
import { useAuthorDirectory } from '../../hooks/useVerifiedAuthors';
import { ColombianVerifiedBadge, isAuthorVerificationActive } from '../common/ColombianVerifiedBadge';
import { OwnerVerifiedBadge, isOwnerAuthor } from '../common/OwnerVerifiedBadge';
import { AuthorPublicProfileModal } from './AuthorPublicProfileModal';
import { sanitizeSafeUrl } from '../../utils/security';

interface EditorialHubSectionProps {
  articles: Article[];
  onReadArticle: (slug: string) => void;
}

const POLL_VOTED_STORAGE_KEY = 'jc_voted_polls_v1';

export const EditorialHubSection: React.FC<EditorialHubSectionProps> = ({
  articles,
  onReadArticle
}) => {
  const [polls, setPolls] = useState<CitizenPoll[]>([]);
  const [events, setEvents] = useState<EditorialEvent[]>([]);
  const [recognitions, setRecognitions] = useState<CollaboratorRecognition[]>([]);
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(POLL_VOTED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorProfile | null>(null);

  const { profiles } = useAuthorDirectory();

  useEffect(() => {
    Promise.all([
      getCitizenPolls({ activeOnly: true }),
      getEditorialEvents(),
      getCollaboratorRecognitions()
    ])
      .then(([p, ev, rec]) => {
        setPolls(p);
        setEvents(ev);
        setRecognitions(rec);
      })
      .catch(() => {});
  }, []);

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls[pollId] || votingPollId === pollId) return;
    setVotingPollId(pollId);
    try {
      let voterId = localStorage.getItem('jc_voter_device_id');
      if (!voterId) {
        voterId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem('jc_voter_device_id', voterId);
      }
      await voteInCitizenPoll(pollId, optionId, voterId);
      const nextVoted = { ...votedPolls, [pollId]: optionId };
      setVotedPolls(nextVoted);
      localStorage.setItem(POLL_VOTED_STORAGE_KEY, JSON.stringify(nextVoted));
      const updated = await getCitizenPolls({ activeOnly: true });
      setPolls(updated);
    } catch (e) {
      console.error('Error voting in poll:', e);
    } finally {
      setVotingPollId(null);
    }
  };

  const handleOpenPollCreatorProfile = (poll: CitizenPoll) => {
    const creatorEmail = (poll.creatorEmail || '').toLowerCase();
    const matched =
      profiles.find(
        (p) =>
          (creatorEmail && p.email?.toLowerCase() === creatorEmail) ||
          (poll.creatorName && p.fullName.toLowerCase() === poll.creatorName.toLowerCase())
      ) || null;

    if (matched) {
      setSelectedAuthor(matched);
      return;
    }

    setSelectedAuthor({
      id: `poll_creator_${poll.id}`,
      fullName: poll.creatorName || 'Julian Camilo',
      email: poll.creatorEmail,
      photoUrl: poll.creatorPhotoUrl,
      role: poll.creatorRole || 'owner',
      verificationStatus: poll.creatorRole === 'owner' ? 'verificado' : 'no_verificado',
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt
    });
  };

  const publishedArticles = articles.filter(
    (a) => a.status === 'published' || a.status === 'publicado'
  );

  // Most Read
  const mostRead = [...publishedArticles]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 4);

  // Trending (by views + reactions)
  const trending = [...publishedArticles]
    .sort((a, b) => {
      const scoreA =
        (a.views || 0) +
        ((a.reactions?.yellow || 0) + (a.reactions?.blue || 0) + (a.reactions?.red || 0)) * 5;
      const scoreB =
        (b.views || 0) +
        ((b.reactions?.yellow || 0) + (b.reactions?.blue || 0) + (b.reactions?.red || 0)) * 5;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  // Most Commented / Debated (by reactions + views)
  const mostCommented = [...publishedArticles]
    .sort((a, b) => {
      const reactA = (a.reactions?.yellow || 0) + (a.reactions?.blue || 0) + (a.reactions?.red || 0);
      const reactB = (b.reactions?.yellow || 0) + (b.reactions?.blue || 0) + (b.reactions?.red || 0);
      return reactB - reactA || (b.views || 0) - (a.views || 0);
    })
    .slice(0, 4);

  const filteredEvents = events.filter((ev) =>
    eventCategoryFilter === 'all' ? true : ev.category === eventCategoryFilter
  );

  return (
    <div className="space-y-14 pt-6 border-t border-[#e8e5dc] dark:border-stone-800">
      {/* 1. Tendencias, Más Leídos y Más Comentados */}
      {publishedArticles.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            <h2 className="text-2xl font-serif font-bold text-[#121212] dark:text-white">
              Pulso Editorial: Tendencias y Lecturas Destacadas
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tendencias */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400 border-b border-stone-100 dark:border-stone-800 pb-2.5">
                Tendencias del Momento
              </h3>
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {trending.map((art, idx) => (
                  <div
                    key={art.id}
                    onClick={() => onReadArticle(art.slug || art.id)}
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer group flex items-start space-x-3"
                  >
                    <span className="font-serif font-black text-lg text-gold-500/80 leading-none mt-0.5">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-sm text-[#121212] dark:text-white group-hover:text-gold-600 transition-colors line-clamp-2">
                        {art.title}
                      </h4>
                      <span className="text-[11px] text-stone-400 block">
                        {art.categoryName} • {art.views || 0} lecturas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Más Leídos */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-widest text-sky-700 dark:text-sky-400 border-b border-stone-100 dark:border-stone-800 pb-2.5 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Artículos Más Leídos</span>
              </h3>
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {mostRead.map((art, idx) => (
                  <div
                    key={art.id}
                    onClick={() => onReadArticle(art.slug || art.id)}
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer group flex items-start space-x-3"
                  >
                    <span className="font-serif font-black text-lg text-sky-600/70 leading-none mt-0.5">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-sm text-[#121212] dark:text-white group-hover:text-gold-600 transition-colors line-clamp-2">
                        {art.title}
                      </h4>
                      <span className="text-[11px] text-stone-400 block">
                        {art.views || 0} lecturas registradas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Más Comentados */}
            <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400 border-b border-stone-100 dark:border-stone-800 pb-2.5 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Artículos Más Comentados</span>
              </h3>
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {mostCommented.map((art, idx) => (
                  <div
                    key={art.id}
                    onClick={() => onReadArticle(art.slug || art.id)}
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer group flex items-start space-x-3"
                  >
                    <span className="font-serif font-black text-lg text-rose-600/70 leading-none mt-0.5">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-serif font-bold text-sm text-[#121212] dark:text-white group-hover:text-gold-600 transition-colors line-clamp-2">
                        {art.title}
                      </h4>
                      <span className="text-[11px] text-stone-400 block">
                        {(art.reactions?.yellow || 0) + (art.reactions?.blue || 0) + (art.reactions?.red || 0)} reacciones • {art.authorName || 'Julian Camilo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Encuestas Ciudadanas & Agenda de Acontecimientos */}
      {(polls.length > 0 || events.length > 0) && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Encuestas Ciudadanas */}
          {polls.length > 0 && (
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                <h2 className="text-2xl font-serif font-bold text-[#121212] dark:text-white">
                  Encuestas Ciudadanas
                </h2>
              </div>

              <div className="space-y-4">
                {[...polls]
                  .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
                  .map((poll) => {
                    const totalVotes = poll.options.reduce((acc, o) => acc + (o.votes || 0), 0);
                    const userChoice = votedPolls[poll.id];
                    const creatorDisplayName = poll.creatorName || 'Julian Camilo';
                    const isClosed =
                      poll.status === 'cerrada' ||
                      (poll.closesAt && new Date(poll.closesAt).getTime() < Date.now());

                    return (
                      <div
                        key={poll.id}
                        className={`bg-white dark:bg-[#18181c] border rounded-2xl p-6 space-y-4 shadow-xs ${
                          poll.featured
                            ? 'border-gold-500/70 ring-1 ring-gold-500/20'
                            : 'border-[#e8e5dc] dark:border-stone-800'
                        }`}
                      >
                        {/* Creator Header & Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() => handleOpenPollCreatorProfile(poll)}
                            className="inline-flex items-center space-x-2.5 text-left group cursor-pointer"
                            title="Ver perfil público del creador"
                          >
                            {poll.creatorPhotoUrl ? (
                              <img
                                src={poll.creatorPhotoUrl}
                                alt={creatorDisplayName}
                                className="w-8 h-8 rounded-full object-cover border border-gold-500/40"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-700 dark:text-gold-400 flex items-center justify-center font-serif font-bold text-xs">
                                {creatorDisplayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-gold-600 transition-colors block">
                                {creatorDisplayName}
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                Publicada:{' '}
                                {new Date(poll.publishedAt || poll.createdAt).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                                {poll.closesAt &&
                                  ` • Cierra: ${new Date(poll.closesAt).toLocaleDateString('es-CO', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}`}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center space-x-2">
                            {poll.featured && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/20 text-gold-700 dark:text-gold-300">
                                ★ Destacada
                              </span>
                            )}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isClosed
                                  ? 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {isClosed ? '● Cerrada' : '● Activa'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {poll.title && (
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400 block">
                              {poll.title}
                            </span>
                          )}
                          <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                            {poll.question}
                          </h3>
                          {poll.description && (
                            <p className="text-xs text-stone-500 dark:text-stone-400">{poll.description}</p>
                          )}
                          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 pt-0.5">
                            Participantes: <strong className="text-stone-800 dark:text-stone-200">{totalVotes}</strong>
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          {poll.options.map((opt) => {
                            const pct =
                              totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                            const isSelected = userChoice === opt.id;
                            const showResults = Boolean(userChoice) || isClosed;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={Boolean(userChoice) || isClosed || votingPollId === poll.id}
                                onClick={() => handleVote(poll.id, opt.id)}
                                className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                                  isSelected
                                    ? 'border-gold-500 bg-gold-50/50 dark:bg-gold-950/20'
                                    : 'border-stone-200 dark:border-stone-800 hover:border-gold-400 bg-[#faf9f6] dark:bg-stone-900'
                                } ${userChoice || isClosed ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                {showResults && (
                                  <div
                                    className="absolute inset-y-0 left-0 bg-gold-400/20 dark:bg-gold-500/15 transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                )}
                                <div className="relative flex items-center justify-between text-xs font-semibold text-[#121212] dark:text-white">
                                  <span className="flex items-center space-x-1.5">
                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-gold-600" />}
                                    <span>{opt.text}</span>
                                  </span>
                                  {showResults && (
                                    <span className="font-mono font-bold text-gold-700 dark:text-gold-400">
                                      {pct}% ({opt.votes || 0})
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Agenda de Acontecimientos y Calendario */}
          {events.length > 0 && (
            <div className={polls.length > 0 ? 'lg:col-span-6 space-y-5' : 'lg:col-span-12 space-y-5'}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                  <h2 className="text-2xl font-serif font-bold text-[#121212] dark:text-white">
                    Agenda y Calendario de Eventos
                  </h2>
                </div>

                <select
                  value={eventCategoryFilter}
                  onChange={(e) => setEventCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 font-semibold"
                >
                  <option value="all">Todas las categorías</option>
                  <option value="foro">Foro</option>
                  <option value="debate">Debate</option>
                  <option value="lanzamiento">Lanzamiento</option>
                  <option value="cultural">Cultural</option>
                  <option value="civico">Cívico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl divide-y divide-stone-100 dark:divide-stone-800 shadow-xs">
                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500">
                    No hay eventos en esta categoría.
                  </div>
                ) : (
                  filteredEvents.slice(0, 6).map((ev) => {
                    const safeEventUrl = sanitizeSafeUrl(ev.registrationUrl);
                    return (
                      <div key={ev.id} className="p-5 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-gold-100 dark:bg-stone-800 text-gold-900 dark:text-gold-300 text-[10px] font-bold uppercase">
                              {ev.category}
                            </span>
                            <span className="text-xs font-semibold text-stone-500">
                              {new Date(ev.date).toLocaleDateString('es-CO', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                            {ev.title}
                          </h4>
                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                            {ev.description}
                          </p>
                          {ev.location && (
                            <span className="inline-flex items-center space-x-1 text-[11px] text-stone-400 pt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{ev.location}</span>
                            </span>
                          )}
                        </div>

                        {safeEventUrl && (
                          <a
                            href={safeEventUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-gold-600 shrink-0"
                            title="Más información"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. Autores Destacados y Reconocimiento a Colaboradores */}
      {(profiles.length > 0 || recognitions.length > 0) && (
        <section className="space-y-6">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            <h2 className="text-2xl font-serif font-bold text-[#121212] dark:text-white">
              Autores Destacados y Reconocimientos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {profiles.slice(0, 6).map((prof) => {
              const verified = isAuthorVerificationActive(prof);
              return (
                <div
                  key={prof.id}
                  onClick={() => setSelectedAuthor(prof)}
                  className="bg-white dark:bg-[#18181c] border border-[#e8e5dc] dark:border-stone-800 rounded-2xl p-5 flex items-start space-x-4 hover:border-gold-500 transition-all cursor-pointer shadow-xs"
                >
                  {prof.photoUrl ? (
                    <img
                      src={prof.photoUrl}
                      alt={prof.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-gold-400 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-serif font-bold text-stone-500 shrink-0">
                      {prof.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white flex items-center space-x-1.5">
                      <span className="truncate">{prof.fullName}</span>
                      {isOwnerAuthor(prof.email, prof.role, prof.fullName) ? (
                        <OwnerVerifiedBadge size="sm" />
                      ) : (
                        verified && <ColombianVerifiedBadge size="sm" />
                      )}
                    </h4>
                    {prof.showOccupationPublic && prof.occupation && (
                      <p className="text-xs text-gold-700 dark:text-gold-400 font-medium truncate">
                        {prof.occupation}
                      </p>
                    )}
                    {prof.bio && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                        {prof.bio}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {recognitions.map((rec) => (
              <div
                key={rec.id}
                className="bg-[#faf9f6] dark:bg-stone-900 border border-gold-300/80 dark:border-stone-800 rounded-2xl p-5 space-y-2 shadow-xs"
              >
                <span className="px-2.5 py-0.5 rounded-full bg-gold-100 dark:bg-gold-950/60 text-gold-900 dark:text-gold-300 text-[10px] font-bold uppercase tracking-wider">
                  {rec.title}
                </span>
                <h4 className="font-serif font-bold text-base text-[#121212] dark:text-white">
                  {rec.authorName}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedAuthor && (
        <AuthorPublicProfileModal
          isOpen={Boolean(selectedAuthor)}
          authorName={selectedAuthor.fullName}
          authorProfile={selectedAuthor}
          articles={articles}
          onClose={() => setSelectedAuthor(null)}
          onReadArticle={(slug) => {
            setSelectedAuthor(null);
            onReadArticle(slug);
          }}
        />
      )}
    </div>
  );
};
